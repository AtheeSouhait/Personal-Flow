import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { dailyTodosApi } from '@/api/dailyTodos'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Repeat, Sunrise } from 'lucide-react'
import type { DailyTodo } from '@/types'

const LAST_TRIAGE_KEY = 'pf-last-triage-date'

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
    .getDate()
    .toString()
    .padStart(2, '0')}`
}

export function isTriageDue(): boolean {
  return localStorage.getItem(LAST_TRIAGE_KEY) !== todayKey()
}

interface MorningTriageDialogProps {
  todos: DailyTodo[]
}

// Once a day, ask what to do with yesterday's leftovers instead of letting
// the list silently pile up: completed one-offs are archived, recurring items
// reset, and stale incomplete items are explicitly kept or dropped.
export function MorningTriageDialog({ todos }: MorningTriageDialogProps) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [keepIds, setKeepIds] = useState<Set<number>>(new Set())

  const completedRecurring = useMemo(() => todos.filter(t => t.isCompleted && t.isRecurring), [todos])
  const completedOneOff = useMemo(() => todos.filter(t => t.isCompleted && !t.isRecurring), [todos])
  const incomplete = useMemo(() => todos.filter(t => !t.isCompleted), [todos])

  const hasWork = completedRecurring.length > 0 || completedOneOff.length > 0 || incomplete.length > 0

  useEffect(() => {
    if (open) return
    if (todos.length > 0 && isTriageDue() && hasWork && (completedRecurring.length > 0 || completedOneOff.length > 0 || incomplete.length > 0)) {
      // Only prompt when there is actually something to triage from a previous day
      const anyFromBefore = todos.some(t => {
        const created = new Date(t.createdAt)
        const completed = t.completedAt ? new Date(t.completedAt) : null
        const ref = completed ?? created
        return ref.toDateString() !== new Date().toDateString()
      })
      if (anyFromBefore) {
        setKeepIds(new Set(incomplete.map(t => t.id)))
        setOpen(true)
      } else {
        localStorage.setItem(LAST_TRIAGE_KEY, todayKey())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todos.length])

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => dailyTodosApi.update(id, data),
  })

  const deleteMutation = useMutation({
    mutationFn: dailyTodosApi.delete,
  })

  const toggleKeep = (id: number) => {
    setKeepIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleStartDay = async () => {
    const ops: Promise<unknown>[] = []
    // Completed one-offs are archived (removed)
    for (const todo of completedOneOff) {
      ops.push(deleteMutation.mutateAsync(todo.id))
    }
    // Completed recurring todos reset for today
    for (const todo of completedRecurring) {
      ops.push(updateMutation.mutateAsync({ id: todo.id, data: { isCompleted: false } }))
    }
    // Incomplete todos that weren't kept are dropped
    for (const todo of incomplete) {
      if (!keepIds.has(todo.id)) {
        ops.push(deleteMutation.mutateAsync(todo.id))
      }
    }
    await Promise.allSettled(ops)
    localStorage.setItem(LAST_TRIAGE_KEY, todayKey())
    queryClient.invalidateQueries({ queryKey: ['dailyTodos'] })
    setOpen(false)
  }

  const handleSkip = () => {
    localStorage.setItem(LAST_TRIAGE_KEY, todayKey())
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleSkip() }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sunrise className="h-5 w-5 text-amber-500" />
            New day — let's reset the list
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {(completedOneOff.length > 0 || completedRecurring.length > 0) && (
            <div className="rounded-md border border-green-500/30 bg-green-500/5 p-3 text-sm">
              <p className="font-medium text-green-700 dark:text-green-400 mb-1">
                Nice — {completedOneOff.length + completedRecurring.length} done last time
              </p>
              <p className="text-muted-foreground text-xs">
                Completed items will be cleared.
                {completedRecurring.length > 0 && (
                  <>
                    {' '}
                    <Repeat className="inline h-3 w-3" /> Recurring ones come back unchecked for today.
                  </>
                )}
              </p>
            </div>
          )}

          {incomplete.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Carry these over to today?</p>
              <p className="text-xs text-muted-foreground">
                Unchecked items will be dropped — it's okay to let go.
              </p>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {incomplete.map(todo => (
                  <label
                    key={todo.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={keepIds.has(todo.id)}
                      onCheckedChange={() => toggleKeep(todo.id)}
                    />
                    <span className="text-sm flex-1">{todo.title}</span>
                    {todo.isRecurring && <Repeat className="h-3.5 w-3.5 text-muted-foreground" />}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={handleSkip}>
              Not now
            </Button>
            <Button size="sm" onClick={handleStartDay}>
              Start the day
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
