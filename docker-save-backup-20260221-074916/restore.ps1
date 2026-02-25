[CmdletBinding()]
param(
  [string]$DataRoot,
  [switch]$SkipImages,
  [switch]$SkipBinds,
  [switch]$SkipVolumes,
  [string]$OverrideFile = 'docker-compose.override.yml'
)

$ErrorActionPreference = 'Stop'

function Write-Note([string]$Message) { Write-Host $Message -ForegroundColor Cyan }
function Write-Warn([string]$Message) { Write-Warning $Message }

$BackupDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ManifestPath = Join-Path $BackupDir 'manifest.json'
if (-not (Test-Path $ManifestPath)) { throw "Missing manifest.json in $BackupDir" }

$m = Get-Content $ManifestPath -Raw | ConvertFrom-Json

if (-not $DataRoot) {
  $projectName = $m.config.projectName
  if ([string]::IsNullOrWhiteSpace($projectName)) { $projectName = 'project' }
  $defaultRoot = Join-Path $env:USERPROFILE ("docker-save\\" + $projectName)
  $answer = Read-Host "Bind data root (Windows path). Default: $defaultRoot"
  $DataRoot = if ([string]::IsNullOrWhiteSpace($answer)) { $defaultRoot } else { $answer }
}

$DataRoot = [System.IO.Path]::GetFullPath($DataRoot)
New-Item -ItemType Directory -Force -Path $DataRoot | Out-Null
Write-Note "Backup:   $BackupDir"
Write-Note "DataRoot: $DataRoot"

$binds = @()
if ($null -ne $m.binds) { $binds = $m.binds }
$bindMap = @{}
foreach ($b in $binds) {
  $dest = Join-Path $DataRoot $b.suggestedName
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  $bindMap[$b.originalSource] = $dest

  if ($SkipBinds) { continue }
  $zipPath = Join-Path $BackupDir $b.archive
  if (-not (Test-Path $zipPath)) { Write-Warn "Missing bind archive: $($b.archive)"; continue }
  Write-Note "Extract bind -> $dest  (from $($b.archive))"
  Expand-Archive -Force -Path $zipPath -DestinationPath $dest
}

$images = @()
if ($null -ne $m.images) { $images = $m.images }
if (-not $SkipImages) {
  foreach ($img in $images) {
    $zipPath = Join-Path $BackupDir $img.archive
    if (-not (Test-Path $zipPath)) { Write-Warn "Missing image archive: $($img.archive)"; continue }
    $tmp = Join-Path ([System.IO.Path]::GetTempPath()) ([System.Guid]::NewGuid().ToString('n'))
    New-Item -ItemType Directory -Force -Path $tmp | Out-Null
    try {
      Write-Note "Load image: $($img.image)"
      Expand-Archive -Force -Path $zipPath -DestinationPath $tmp
      $tar = Get-ChildItem -Path $tmp -Filter *.tar | Select-Object -First 1
      if (-not $tar) { throw "No .tar found inside $($img.archive)" }
      docker load -i $tar.FullName | Out-Host
    } finally {
      Remove-Item -Recurse -Force -Path $tmp -ErrorAction SilentlyContinue
    }
  }
}

$volumes = @()
if ($null -ne $m.volumes) { $volumes = $m.volumes }
if (-not $SkipVolumes) {
  foreach ($v in $volumes) {
    $zipPath = Join-Path $BackupDir $v.archive
    if (-not (Test-Path $zipPath)) { Write-Warn "Missing volume archive: $($v.archive)"; continue }
    $tmp = Join-Path ([System.IO.Path]::GetTempPath()) ([System.Guid]::NewGuid().ToString('n'))
    New-Item -ItemType Directory -Force -Path $tmp | Out-Null
    try {
      Write-Note "Restore named volume: $($v.name)"
      Expand-Archive -Force -Path $zipPath -DestinationPath $tmp
      $tar = Get-ChildItem -Path $tmp -Filter *.tar | Select-Object -First 1
      if (-not $tar) { throw "No .tar found inside $($v.archive)" }
      docker volume create $v.name | Out-Null
      docker run --rm -v "$($v.name):/data" -v "$($tmp.Replace('\\','/')):/backup" alpine:3.19 `
        sh -c "cd /data && tar -xf /backup/$($tar.Name)" | Out-Host
    } finally {
      Remove-Item -Recurse -Force -Path $tmp -ErrorAction SilentlyContinue
    }
  }
}

# Generate override (bind sources rewritten to the restored locations)
$overridePath = if ([System.IO.Path]::IsPathRooted($OverrideFile)) { $OverrideFile } else { Join-Path $BackupDir $OverrideFile }
$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("services:")

$serviceNames = @()
if ($m.services) { $serviceNames = $m.services.PSObject.Properties.Name | Sort-Object }
foreach ($svc in $serviceNames) {
  $lines.Add("  ${svc}:")
  $lines.Add("    volumes:")
  foreach ($mount in $m.services.$svc) {
    if ($mount.type -eq 'bind') {
      $orig = [string]$mount.source
      if (-not $bindMap.ContainsKey($orig)) { throw "No bind mapping for: $orig" }
      $src = $bindMap[$orig]
      $lines.Add("      - type: bind")
      $lines.Add("        source: '$src'")
      $lines.Add("        target: $($mount.target)")
      if ($mount.readOnly -eq $true) { $lines.Add("        read_only: true") }
    } elseif ($mount.type -eq 'volume') {
      $lines.Add("      - type: volume")
      $lines.Add("        source: $($mount.source)")
      $lines.Add("        target: $($mount.target)")
      if ($mount.readOnly -eq $true) { $lines.Add("        read_only: true") }
    }
  }
}

Set-Content -Path $overridePath -Value ($lines -join "`n") -Encoding UTF8
Write-Note "Wrote override: $overridePath"

Write-Host ""
Write-Host "Next steps (not executed):"
Write-Host "  cd `"$BackupDir`""
Write-Host "  docker compose -f docker-compose.yml -f $OverrideFile up -d"
Write-Host ""
Write-Host "Tip: If Docker Desktop can't access the drive, enable it in Docker Desktop > Settings > Resources > File Sharing."
