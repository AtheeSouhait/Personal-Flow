import { useQuery } from '@tanstack/react-query'
import { tasksApi } from '@/api/tasks'
import { dailyTodosApi } from '@/api/dailyTodos'
import { getStreak } from '@/lib/streak'
import { Flame, Trophy } from 'lucide-react'

function isToday(dateStr?: string): boolean {
  if (!dateStr) return false
  return new Date(dateStr).toDateString() === new Date().toDateString()
}

// Visible proof of what got done today — counters the "I did nothing" feeling.
export default function TodayProgress() {
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.getAll() })
  const { data: todos = [] } = useQuery({ queryKey: ['dailyTodos'], queryFn: dailyTodosApi.getAll })

  const tasksDoneToday = tasks.filter((t) => t.status === 'Completed' && isToday(t.updatedAt))
  const todosDoneToday = todos.filter((t) => t.isCompleted && isToday(t.completedAt))
  const doneCount = tasksDoneToday.length + todosDoneToday.length
  const streak = getStreak()

  if (doneCount === 0 && streak === 0) return null

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {doneCount > 0 && (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30">
          <Trophy className="h-4 w-4" />
          {doneCount} done today
        </span>
      )}
      {streak > 0 && (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/30">
          <Flame className="h-4 w-4" />
          {streak}-day streak
        </span>
      )}
    </div>
  )
}
