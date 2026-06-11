import { Task } from '@/types'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/api/tasks'
import { SubtaskList } from './SubtaskList'
import { useCelebration } from '@/context/CelebrationContext'
import { getDueUrgency, urgencyChipClasses, urgencyLabels, formatMinutes } from '@/lib/urgency'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Slider } from './ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { EditableText } from './ui/editable-text'
import { PomodoroTimer } from './ui/pomodoro-timer'
import { Calendar, Flag, Timer, Trash2, X } from 'lucide-react'
import { Input } from './ui/input'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'

const priorityColors = {
  Low: 'text-gray-500',
  Medium: 'text-blue-500',
  High: 'text-orange-500',
  Critical: 'text-red-500',
}

interface TaskDetailDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateTask: (id: number, data: any) => void
  onDeleteTask: (id: number) => void
  isUpdating: boolean
}

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  onUpdateTask,
  onDeleteTask,
  isUpdating,
}: TaskDetailDialogProps) {
  const [editingDescription, setEditingDescription] = useState(false)
  const [descriptionDraft, setDescriptionDraft] = useState('')
  const [completedPomodoro, setCompletedPomodoro] = useState(false)
  const queryClient = useQueryClient()
  const { celebrate } = useCelebration()

  const logTimeMutation = useMutation({
    mutationFn: ({ id, seconds }: { id: number; seconds: number }) => tasksApi.logTime(id, seconds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  if (!task) return null

  const urgency = task.status === 'Completed' ? 'none' : getDueUrgency(task.dueDate)

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0]
    const updateData: any = { progressPercentage: newProgress }

    if (newProgress > 0 && task.status === 'NotStarted') {
      updateData.status = 'InProgress'
    }
    if (newProgress === 100) {
      updateData.status = 'Completed'
      if (task.status !== 'Completed') celebrate('Task completed!')
    }

    onUpdateTask(task.id, updateData)
  }

  const handleStatusChange = (value: string) => {
    if (value === 'Completed' && task.status !== 'Completed') {
      celebrate('Task completed!')
    }
    onUpdateTask(task.id, { status: value })
  }

  const handleStartDescriptionEdit = () => {
    setEditingDescription(true)
    setDescriptionDraft(task.description ?? '')
  }

  const handleSaveDescription = () => {
    const trimmed = descriptionDraft.trim()
    if (trimmed !== (task.description ?? '').trim()) {
      onUpdateTask(task.id, { description: trimmed || undefined })
    }
    setEditingDescription(false)
  }

  const handleCancelDescriptionEdit = () => {
    setEditingDescription(false)
    setDescriptionDraft('')
  }

  const handlePomodoroComplete = (elapsedSeconds: number) => {
    setCompletedPomodoro(true)
    logTimeMutation.mutate({ id: task.id, seconds: elapsedSeconds })
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Complete!', {
        body: `Time's up for: ${task.title}`,
        icon: '/vite.svg',
      })
    }
    setTimeout(() => setCompletedPomodoro(false), 5000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className={`h-4 w-4 flex-shrink-0 ${priorityColors[task.priority]}`} />
            <div className="flex-1">
              <EditableText
                value={task.title}
                onSave={(title) => onUpdateTask(task.id, { title })}
                isLoading={isUpdating}
                placeholder="Task name..."
              />
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Description */}
          <div>
            {editingDescription ? (
              <div className="space-y-2">
                <Textarea
                  value={descriptionDraft}
                  onChange={(e) => setDescriptionDraft(e.target.value)}
                  rows={4}
                  className="resize-none"
                  placeholder="Add a description..."
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveDescription}
                    disabled={isUpdating}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelDescriptionEdit}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {task.description && (
                  <div className="prose prose-sm max-w-none dark:prose-invert break-words">
                    <ReactMarkdown>{task.description}</ReactMarkdown>
                  </div>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 h-7 px-2 text-xs"
                  onClick={handleStartDescriptionEdit}
                >
                  {task.description ? 'Edit description' : 'Add description'}
                </Button>
              </>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{task.progressPercentage}%</span>
            </div>
            <Slider
              value={[task.progressPercentage]}
              onValueChange={handleProgressChange}
              max={100}
              step={5}
              className="cursor-pointer"
            />
          </div>

          {/* Subtasks */}
          <div className="pt-2 border-t">
            <SubtaskList task={task} />
          </div>

          {/* Status & Due Date */}
          <div className="flex items-center justify-between gap-4 flex-wrap pt-2 border-t">
            <Select value={task.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NotStarted">Not Started</SelectItem>
                <SelectItem value="InProgress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Calendar
                className={`h-4 w-4 ${
                  urgency === 'overdue'
                    ? 'text-red-500'
                    : urgency === 'today'
                      ? 'text-amber-500'
                      : 'text-muted-foreground'
                }`}
              />
              <Input
                type="date"
                value={task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    onUpdateTask(task.id, { dueDate: e.target.value })
                  } else {
                    onUpdateTask(task.id, { clearDueDate: true })
                  }
                }}
                className="h-8 w-[150px] text-sm"
              />
              {task.dueDate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Clear due date"
                  onClick={() => onUpdateTask(task.id, { clearDueDate: true })}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {urgency !== 'none' && urgencyLabels[urgency] && (
            <div className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${urgencyChipClasses[urgency]}`}>
              {urgencyLabels[urgency]}
            </div>
          )}

          {/* Time estimate & actual */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Estimate</span>
              <Input
                type="number"
                min="0"
                placeholder="min"
                value={task.estimatedMinutes ?? ''}
                onChange={(e) => {
                  const v = parseInt(e.target.value)
                  if (Number.isNaN(v) || v <= 0) {
                    onUpdateTask(task.id, { clearEstimate: true })
                  } else {
                    onUpdateTask(task.id, { estimatedMinutes: v })
                  }
                }}
                className="h-8 w-20 text-sm"
              />
              <span className="text-xs text-muted-foreground">min</span>
            </div>
            {task.actualSeconds > 0 && (
              <div className="text-sm text-muted-foreground">
                Focused:{' '}
                <span
                  className={`font-medium ${
                    task.estimatedMinutes && task.actualSeconds / 60 > task.estimatedMinutes
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-foreground'
                  }`}
                >
                  {formatMinutes(Math.round(task.actualSeconds / 60))}
                </span>
                {task.estimatedMinutes ? ` / ${formatMinutes(task.estimatedMinutes)} estimated` : ''}
              </div>
            )}
          </div>

          {/* Pomodoro Timer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">Pomodoro Timer</span>
            <PomodoroTimer
              defaultMinutes={25}
              onComplete={handlePomodoroComplete}
            />
          </div>

          {completedPomodoro && (
            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md animate-in fade-in slide-in-from-top-2">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Pomodoro Complete!
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Great work on "{task.title}"! Time for a break.
              </p>
            </div>
          )}

          {/* Delete */}
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onDeleteTask(task.id)
                onOpenChange(false)
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
