// Completion streak tracking, persisted in localStorage.
// A day counts toward the streak when at least one task or daily todo was completed.

const STORAGE_KEY = 'pf-completion-days'
const MAX_DAYS = 366

function todayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

function loadDays(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function recordCompletionToday(): void {
  const days = loadDays()
  const key = todayKey()
  if (!days.includes(key)) {
    days.push(key)
    days.sort()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(days.slice(-MAX_DAYS)))
  }
}

export function getStreak(): number {
  const days = new Set(loadDays())
  let streak = 0
  const cursor = new Date()
  // Today counts if present, but an empty today doesn't break yesterday's streak
  if (days.has(todayKey(cursor))) streak++
  cursor.setDate(cursor.getDate() - 1)
  while (days.has(todayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
