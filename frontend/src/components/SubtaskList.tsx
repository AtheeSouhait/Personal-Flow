import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { subtasksApi } from '@/api/tasks'
import { Checkbox } from './ui/checkbox'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Plus, Trash2 } from 'lucide-react'
import type { Task } from '@/types'
import { useCelebration } from '@/context/CelebrationContext'

interface SubtaskListProps {
  task: Task
}

export function SubtaskList({ task }: SubtaskListProps) {
  const queryClient = useQueryClient()
  const { celebrate } = useCelebration()
  const [newTitle, setNewTitle] = useState('')

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['projects'] })
  }

  const createMutation = useMutation({
    mutationFn: (title: string) => subtasksApi.create(task.id, { title }),
    onSuccess: () => {
      invalidate()
      setNewTitle('')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: number; isCompleted: boolean }) =>
      subtasksApi.update(id, { isCompleted }),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: subtasksApi.delete,
    onSuccess: invalidate,
  })

  const subtasks = task.subtasks ?? []
  const done = subtasks.filter((s) => s.isCompleted).length

  const handleAdd = () => {
    const title = newTitle.trim()
    if (title) createMutation.mutate(title)
  }

  const handleToggle = (id: number, isCompleted: boolean) => {
    updateMutation.mutate({ id, isCompleted })
    // Checking off the last open subtask earns a celebration
    if (isCompleted && done + 1 === subtasks.length) {
      celebrate('All steps done!')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Steps</span>
        {subtasks.length > 0 && (
          <span className={`font-medium ${done === subtasks.length ? 'text-green-600 dark:text-green-400' : ''}`}>
            {done}/{subtasks.length}
          </span>
        )}
      </div>

      {subtasks.length > 0 && (
        <div className="space-y-1">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50 transition-colors"
            >
              <Checkbox
                checked={subtask.isCompleted}
                onCheckedChange={(checked) => handleToggle(subtask.id, checked === true)}
              />
              <span
                className={`flex-1 text-sm ${
                  subtask.isCompleted ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {subtask.title}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                onClick={() => deleteMutation.mutate(subtask.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          placeholder="Break it into a small step..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="h-8 text-sm"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={handleAdd}
          disabled={!newTitle.trim() || createMutation.isPending}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
