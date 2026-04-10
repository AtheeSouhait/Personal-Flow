import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/api/tasks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskDetailDialog } from '@/components/TaskDetailDialog'
import { KanbanCard, type DragPosition } from '@/components/KanbanCard'
import type { Task } from '@/types'

export default function NextTasks() {
  const queryClient = useQueryClient()
  const [draggedItem, setDraggedItem] = useState<Task | null>(null)
  const [dropIndicator, setDropIndicator] = useState<DragPosition | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.getAll(),
  })

  // Filter out completed and blocked, then initial sort if displayOrder isn't really used yet (wait, displayOrder is saved on backend)
  // Reordering changes displayOrder, so we rely on displayOrder primarily.
  // The user asked to be "sorted like this: in progress first, the more advanced completion first"
  // If we just sort locally by that exactly, then the manual user reorder (which saves to backend displayOrder) won't work,
  // because local sort will override displayOrder.
  // Actually, if we sort by displayOrder, but fallback to status/progress if displayOrder is roughly 0 globally?
  // Let's sort primarily by displayOrder, but initially maybe their order is arbitrary.
  // If the user wants complete manual control, we must sort by displayOrder.
  // But wait, the prompt says "sorted like this: in progress first, the more advanced completion first."
  // Maybe we just sort them exactly by status / progress, and IF they drag and drop, what to do?
  // If we just sort by displayOrder, the user can do the initial ordering manually.
  // Wait, I will sort by displayOrder if it is distinct, otherwise by status and progress.

  const sortedTasks = [...allTasks].filter(t => t.status === 'NotStarted' || t.status === 'InProgress')
    .sort((a, b) => {
      // Prioritize displayOrder if user has explicitly ordered them.
      // Assuming initial `displayOrder` is just 0 or order in the project.
      // If we sort purely by displayOrder, it might interleave "Not started" and "In Progress"
      // Let's just create a composite sort that allows displayOrder to rule when status is the same?
      // "user can reorder them : the not started and in progress task cards are displayed in a column, sorted like this: in progress first, the more advanced completion first."
      // Let's do exactly what is asked: In Progress first, then more advanced completion first.
      if (a.status !== b.status) {
        if (a.status === 'InProgress') return -1
        if (b.status === 'InProgress') return 1
      }
      
      // If same status, or both InProgress
      if (a.progressPercentage !== b.progressPercentage) {
         return b.progressPercentage - a.progressPercentage
      }
      
      // Then displayOrder
      return a.displayOrder - b.displayOrder
    })

  // A manual full reorder without touching the initial grouping logic will just break visually if you drop "Not Started" into "In Progress"?
  // Yes. If that happens, maybe it's fine. The prompt says "sorted like this... user can reorder them". Let's assume reorder is standard task drag and drop within that column. Let's just group by that sorting above and not worry too much until drag and drop happens! Wait, if drag and drop happens, we just modify `displayOrder`, but they won't reorder if status/progress differs, because status/progress takes priority!
  // Oh, wait! If they drop a NotStarted above an InProgress, but my sort function says "InProgress first", it will jump back.
  // Is it better to just sort by DisplayOrder, but on first load when no reorder has happened (or to initialize the order), sort by InProgress/Completion?
  // Let's just use `DisplayOrder` as the absolute truth for rendering, but provide a "Sort by Progress" button? No, user said "sorted like this ... user can reorder them".
  // Okay, maybe `DisplayOrder` is the *only* sort, but when `tasksApi.getAll()` is called, they are naturally returned in some order.
  // Or maybe I just sort them locally by the custom logic, but if drag and drop happens, we alter `displayOrder` and *use* `displayOrder` overriding the others?
  // Let's just sort purely by `displayOrder` for simplicity, but wait, the prompt is explicit. I will follow an initial grouping and then use `displayOrder`.
  // Wait, if I sort by `displayOrder`, how do I guarantee "in progress first" initially? I can't.
  // What if I just use the custom sort: Status -> Progress -> DisplayOrder.
  // If the user wants to reorder, changing `displayOrder` will only reorder items *with the same status and progress*.
  // That satisfies "in progress first" permanently, while allowing reorder within those buckets. That's a very common pattern! Let's do that.

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => tasksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const reorderMutation = useMutation({
    mutationFn: tasksApi.reorder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const handleDragStart = (task: Task, e: React.DragEvent) => {
    setDraggedItem(task)
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'task', id: task.id }))
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDropIndicator(null)
  }

  const handleDragOver = (e: React.DragEvent, targetTask: Task) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.id === targetTask.id) return

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const y = e.clientY - rect.top
    const position = y < rect.height / 2 ? 'before' : 'after'

    setDropIndicator({ taskId: targetTask.id, position })
  }

  const handleDrop = (e: React.DragEvent, targetTask: Task) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.id === targetTask.id || !dropIndicator) {
      setDropIndicator(null)
      return
    }

    const newTasks = [...sortedTasks]
    const draggedIndex = newTasks.findIndex((t) => t.id === draggedItem.id)
    const targetIndex = newTasks.findIndex((t) => t.id === targetTask.id)

    newTasks.splice(draggedIndex, 1)
    
    // adjust targetIndex after removal
    const insertIndex = 
      dropIndicator.position === 'after' 
        ? (draggedIndex < targetIndex ? targetIndex : targetIndex + 1)
        : (draggedIndex < targetIndex ? targetIndex - 1 : targetIndex)

    newTasks.splice(insertIndex, 0, draggedItem)

    // Reorder all visible tasks
    reorderMutation.mutate({ taskIds: newTasks.map((t) => t.id) })

    setDraggedItem(null)
    setDropIndicator(null)
  }

  if (isLoading) {
    return (
      <Card className="h-full bg-card">
        <CardHeader>
          <CardTitle>Next Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading tasks...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Next Tasks</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-2">
        {sortedTasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No pending tasks.
          </div>
        ) : (
          sortedTasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              isDragging={draggedItem?.id === task.id}
              dropIndicator={dropIndicator}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => {
                setSelectedTask(task)
                setIsTaskDetailOpen(true)
              }}
              showProjectLink={true}
            />
          ))
        )}
      </CardContent>

      <TaskDetailDialog
        task={selectedTask}
        open={isTaskDetailOpen}
        onOpenChange={setIsTaskDetailOpen}
        onUpdateTask={(id, data) => updateMutation.mutate({ id, data })}
        onDeleteTask={(id) => {
          deleteMutation.mutate(id)
          setIsTaskDetailOpen(false)
        }}
        isUpdating={updateMutation.isPending}
      />
    </Card>
  )
}
