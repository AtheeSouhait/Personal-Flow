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
                      {task.description && (
                        <CardDescription className="line-clamp-2">
                          {task.description}
                        </CardDescription>
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

                  <div className="flex items-center justify-between gap-4">
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
