import { Task } from '@/types'
import { useState } from 'react'
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
import { Calendar, Flag, Trash2 } from 'lucide-react'
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

  if (!task) return null

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0]
    const updateData: any = { progressPercentage: newProgress }

    if (newProgress > 0 && task.status === 'NotStarted') {
      updateData.status = 'InProgress'
    }
    if (newProgress === 100) {
      updateData.status = 'Completed'
    }

    onUpdateTask(task.id, updateData)
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

  const handlePomodoroComplete = () => {
    setCompletedPomodoro(true)
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

          {/* Status & Due Date */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Select
              value={task.status}
              onValueChange={(value) => onUpdateTask(task.id, { status: value })}
            >
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

            {task.dueDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(new Date(task.dueDate), 'MMM d, yyyy')}
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
