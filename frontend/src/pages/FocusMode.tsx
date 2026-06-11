import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/api/tasks'
import { dailyTodosApi } from '@/api/dailyTodos'
import { Button } from '@/components/ui/button'
import { PomodoroTimer } from '@/components/ui/pomodoro-timer'
import { SubtaskList } from '@/components/SubtaskList'
import { usePinnedTodos } from '@/context/PinnedTodosContext'
import { useCelebration } from '@/context/CelebrationContext'
import { formatMinutes } from '@/lib/urgency'
import { ArrowLeft, Check, SkipForward, Crosshair } from 'lucide-react'
import type { DailyTodo, Task } from '@/types'

type FocusItem =
  | { kind: 'todo'; todo: DailyTodo }
  | { kind: 'task'; task: Task }

// One thing at a time: shows the single most relevant item with a timer,
// hiding the rest of the app to avoid the "wall of choices" freeze.
export default function FocusMode() {
  const queryClient = useQueryClient()
  const { pinnedIds } = usePinnedTodos()
  const { celebrate } = useCelebration()
  const [skipped, setSkipped] = useState<string[]>([])

  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => tasksApi.getAll() })
  const { data: todos = [] } = useQuery({ queryKey: ['dailyTodos'], queryFn: dailyTodosApi.getAll })

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const updateTodoMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => dailyTodosApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dailyTodos'] }),
  })

  const logTimeMutation = useMutation({
    mutationFn: ({ id, seconds }: { id: number; seconds: number }) => tasksApi.logTime(id, seconds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  // Same priority order as the Next Tasks panel: pinned todos first,
  // then in-progress tasks by descending progress.
  const queue: FocusItem[] = [
    ...todos
      .filter((t) => pinnedIds.has(t.id) && !t.isCompleted)
      .map((todo): FocusItem => ({ kind: 'todo', todo })),
    ...tasks
      .filter((t) => t.status === 'NotStarted' || t.status === 'InProgress')
      .sort((a, b) => {
        if (a.status !== b.status) {
          if (a.status === 'InProgress') return -1
          if (b.status === 'InProgress') return 1
        }
        if (a.progressPercentage !== b.progressPercentage)
          return b.progressPercentage - a.progressPercentage
        return a.displayOrder - b.displayOrder
      })
      .map((task): FocusItem => ({ kind: 'task', task })),
  ].filter((item) => !skipped.includes(item.kind === 'todo' ? `todo-${item.todo.id}` : `task-${item.task.id}`))

  const current = queue[0]

  const handleDone = () => {
    if (!current) return
    celebrate('Done. One thing at a time wins!')
    if (current.kind === 'todo') {
      updateTodoMutation.mutate({ id: current.todo.id, data: { isCompleted: true } })
    } else {
      updateTaskMutation.mutate({
        id: current.task.id,
        data: { status: 'Completed', progressPercentage: 100 },
      })
    }
  }

  const handleSkip = () => {
    if (!current) return
    setSkipped((prev) => [
      ...prev,
      current.kind === 'todo' ? `todo-${current.todo.id}` : `task-${current.task.id}`,
    ])
  }

  const handlePomodoroComplete = (elapsedSeconds: number) => {
    if (current?.kind === 'task') {
      logTimeMutation.mutate({ id: current.task.id, seconds: elapsedSeconds })
    }
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Exit focus
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Crosshair className="h-4 w-4" />
            Focus mode
            {queue.length > 1 && <span>· {queue.length - 1} more in queue</span>}
          </div>
        </div>

        {!current ? (
          <div className="text-center py-20 space-y-3">
            <p className="text-2xl font-bold">Nothing left to focus on 🎉</p>
            <p className="text-muted-foreground">
              Pin a daily todo or add tasks, then come back here.
            </p>
            <Link to="/">
              <Button className="mt-2">Back to dashboard</Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-primary/30 bg-card shadow-lg p-8 space-y-6">
            <div className="space-y-1 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {current.kind === 'todo'
                  ? 'Daily todo'
                  : current.task.projectTitle || 'Task'}
              </p>
              <h1 className="text-2xl font-bold leading-snug">
                {current.kind === 'todo' ? current.todo.title : current.task.title}
              </h1>
              {current.kind === 'task' && current.task.estimatedMinutes ? (
                <p className="text-sm text-muted-foreground">
                  Estimated: {formatMinutes(current.task.estimatedMinutes)}
                  {current.task.actualSeconds > 0 &&
                    ` · focused so far: ${formatMinutes(Math.round(current.task.actualSeconds / 60))}`}
                </p>
              ) : null}
            </div>

            {current.kind === 'task' && current.task.subtasks?.length > 0 && (
              <div className="max-w-sm mx-auto">
                <SubtaskList task={current.task} />
              </div>
            )}

            <div className="flex justify-center">
              <PomodoroTimer defaultMinutes={25} onComplete={handlePomodoroComplete} />
            </div>

            <div className="flex justify-center gap-3">
              <Button onClick={handleDone} className="bg-green-600 hover:bg-green-700">
                <Check className="h-4 w-4 mr-1" />
                Done
              </Button>
              <Button variant="outline" onClick={handleSkip}>
                <SkipForward className="h-4 w-4 mr-1" />
                Not now
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
