# Restore (docker-save)

This backup contains:
- `images/*.zip` (Docker images; each zip contains a `.tar` for `docker load`)
- `binds/*.zip` (bind-mount data; extracted into a new host data root)
- `volumes/*.zip` (named volumes; restored into Docker volumes)
- `docker-compose.yml` (original compose file copy)
- `manifest.json` (inventory + mount info)

## Windows (Docker Desktop)

From PowerShell:

```powershell
cd <this-backup-folder>
.\restore.ps1
```

It will:
- `docker load` the images
- extract bind data into a folder you choose
- restore named volumes (if any)
- generate `docker-compose.override.yml` with updated bind sources

Then you can start (not executed automatically):

```powershell
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

## Linux / WSL

```bash
cd <this-backup-folder>
chmod +x restore.sh
./restore.sh
```
