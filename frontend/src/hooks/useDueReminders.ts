import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { tasksApi } from '@/api/tasks'
import { getDueUrgency } from '@/lib/urgency'

const LAST_REMINDER_KEY = 'pf-last-due-reminder'

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
    .getDate()
    .toString()
    .padStart(2, '0')}`
}

// Once per day, surface overdue / due-today tasks as a browser notification.
// Out of sight is out of mind — this brings deadlines back into sight.
export function useDueReminders() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getAll(),
  })

  const urgent = tasks.filter(
    (t) => t.status !== 'Completed' && ['overdue', 'today'].includes(getDueUrgency(t.dueDate))
  )

  useEffect(() => {
    if (urgent.length === 0) return
    if (!('Notification' in window)) return
    if (localStorage.getItem(LAST_REMINDER_KEY) === todayKey()) return

    const notify = () => {
      const overdue = urgent.filter((t) => getDueUrgency(t.dueDate) === 'overdue')
      const dueToday = urgent.filter((t) => getDueUrgency(t.dueDate) === 'today')
      const parts: string[] = []
      if (overdue.length > 0) parts.push(`${overdue.length} overdue`)
      if (dueToday.length > 0) parts.push(`${dueToday.length} due today`)
      new Notification('PersonalFlow — deadlines need you', {
        body: `${parts.join(', ')}: ${urgent
          .slice(0, 3)
          .map((t) => t.title)
          .join(', ')}${urgent.length > 3 ? '…' : ''}`,
        icon: '/vite.svg',
      })
      localStorage.setItem(LAST_REMINDER_KEY, todayKey())
    }

    if (Notification.permission === 'granted') {
      notify()
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') notify()
      })
    }
  }, [urgent.length]) // eslint-disable-line react-hooks/exhaustive-deps

  return urgent
}
