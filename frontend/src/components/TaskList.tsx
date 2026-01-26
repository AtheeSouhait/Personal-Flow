import { Task } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Slider } from './ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/api/tasks'
import { Calendar, Flag, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { format } from 'date-fns'
import { EditableText } from './ui/editable-text'
import { PomodoroTimer } from './ui/pomodoro-timer'
import { useState } from 'react'
import { Textarea } from './ui/textarea'

interface TaskListProps {
  tasks: Task[]
  projectId: number
}

const statusColors = {
  NotStarted: 'bg-gray-500',
  InProgress: 'bg-blue-500',
  Completed: 'bg-green-500',
  Blocked: 'bg-red-500',
}

const priorityColors = {
  Low: 'text-gray-500',
  Medium: 'text-blue-500',
  High: 'text-orange-500',
  Critical: 'text-red-500',
}

export function TaskList({ tasks, projectId }: TaskListProps) {
  const queryClient = useQueryClient()
  const [completedTaskId, setCompletedTaskId] = useState<number | null>(null)
  const [editingDescriptionId, setEditingDescriptionId] = useState<number | null>(null)
  const [descriptionDraft, setDescriptionDraft] = useState('')

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId.toString()] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId.toString()] })
    },
  })

  const handleProgressChange = (task: Task, value: number[]) => {
    const newProgress = value[0]
    const updateData: any = { progressPercentage: newProgress }

    // Auto-update status to "In Progress" if progress > 0 and status is "Not Started"
    if (newProgress > 0 && task.status === 'NotStarted') {
      updateData.status = 'InProgress'
    }

    // Auto-update status to "Completed" if progress is 100%
    if (newProgress === 100) {
      updateData.status = 'Completed'
    }

    updateMutation.mutate({
      id: task.id,
      data: updateData,
    })
  }

  const handleStatusChange = (taskId: number, status: string) => {
    updateMutation.mutate({
      id: taskId,
      data: { status },
    })
  }

  const handleTitleChange = (taskId: number, title: string) => {
    updateMutation.mutate({
      id: taskId,
      data: { title },
    })
  }

  const handleStartDescriptionEdit = (task: Task) => {
    setEditingDescriptionId(task.id)
    setDescriptionDraft(task.description ?? '')
  }

  const handleCancelDescriptionEdit = () => {
    setEditingDescriptionId(null)
    setDescriptionDraft('')
  }

  const handleSaveDescriptionEdit = (task: Task) => {
    const trimmedDescription = descriptionDraft.trim()
    if (trimmedDescription === (task.description ?? '').trim()) {
      setEditingDescriptionId(null)
      return
    }

    updateMutation.mutate({
      id: task.id,
      data: { description: trimmedDescription ? descriptionDraft : undefined },
    })
    setEditingDescriptionId(null)
  }

  const handlePomodoroComplete = (taskId: number, taskTitle: string) => {
    setCompletedTaskId(taskId)
    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Complete!', {
        body: `Time's up for: ${taskTitle}`,
        icon: '/vite.svg',
      })
    }
    // Auto-dismiss after 5 seconds
    setTimeout(() => setCompletedTaskId(null), 5000)
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
          No tasks yet. Create one to get started!
        </CardContent>
      </Card>
    )
  }

  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = []
    acc[task.status].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  return (
    <div className="space-y-6">
      {Object.entries(groupedTasks).map(([status, statusTasks]) => (
        <div key={status}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${statusColors[status as keyof typeof statusColors]}`} />
            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              {status.replace(/([A-Z])/g, ' $1').trim()} ({statusTasks.length})
            </h3>
          </div>

          <div className="space-y-3">
            {statusTasks.map((task) => (
              <Card key={task.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base flex-1">
                          <EditableText
                            value={task.title}
                            onSave={(title) => handleTitleChange(task.id, title)}
                            isLoading={updateMutation.isPending}
                            placeholder="Task name..."
                          />
                        </CardTitle>
                        <Flag className={`h-4 w-4 flex-shrink-0 ${priorityColors[task.priority]}`} />
                      </div>
                      {editingDescriptionId === task.id ? (
                        <div className="mt-2 space-y-2">
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
                              onClick={() => handleSaveDescriptionEdit(task)}
                              disabled={updateMutation.isPending}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelDescriptionEdit}
                              disabled={updateMutation.isPending}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {task.description && (
                            <CardDescription className="whitespace-pre-wrap break-words">
                              {task.description}
                            </CardDescription>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2 h-7 px-2 text-xs"
                            onClick={() => handleStartDescriptionEdit(task)}
                          >
                            {task.description ? 'Edit description' : 'Add description'}
                          </Button>
                        </>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(task.id)}
                      className="text-destructive hover:text-destructive flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{task.progressPercentage}%</span>
                    </div>
                    <Slider
                      value={[task.progressPercentage]}
                      onValueChange={(value) => handleProgressChange(task, value)}
                      max={100}
                      step={5}
                      className="cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <Select
                      value={task.status}
                      onValueChange={(value) => handleStatusChange(task.id, value)}
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

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Pomodoro Timer</span>
                    <PomodoroTimer
                      defaultMinutes={25}
                      onComplete={() => handlePomodoroComplete(task.id, task.title)}
                    />
                  </div>

                  {completedTaskId === task.id && (
                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md animate-in fade-in slide-in-from-top-2">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        🎉 Pomodoro Complete!
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Great work on "{task.title}"! Time for a break.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
