import { differenceInCalendarDays } from 'date-fns'

export type Urgency = 'overdue' | 'today' | 'soon' | 'later' | 'none'

export function getDueUrgency(dueDate?: string | null): Urgency {
  if (!dueDate) return 'none'
  const days = differenceInCalendarDays(new Date(dueDate), new Date())
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  if (days <= 7) return 'soon'
  return 'later'
}

export const urgencyChipClasses: Record<Exclude<Urgency, 'none'>, string> = {
  overdue: 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/40 font-semibold',
  today: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 font-semibold',
  soon: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30',
  later: 'bg-muted text-muted-foreground border border-transparent',
}

export const urgencyLabels: Record<Exclude<Urgency, 'none'>, string> = {
  overdue: 'Overdue',
  today: 'Due today',
  soon: '',
  later: '',
}

export function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = Math.round(totalMinutes % 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h${m.toString().padStart(2, '0')}`
}
