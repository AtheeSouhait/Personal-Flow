import { useState, useCallback, useRef, useEffect } from 'react'
import { Task } from '@/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/api/tasks'
import { KanbanColumn } from './KanbanColumn'
import { TaskDetailDialog } from './TaskDetailDialog'
import { CreateTaskDialog } from './CreateTaskDialog'
import { DragPosition } from './KanbanCard'

const COLUMN_ORDER: Task['status'][] = ['NotStarted', 'InProgress', 'Completed', 'Blocked']

interface KanbanBoardProps {
  tasks: Task[]
  projectId: number
}

export function KanbanBoard({ tasks, projectId }: KanbanBoardProps) {
  const queryClient = useQueryClient()
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dropIndicator, setDropIndicator] = useState<DragPosition | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<Task['status'] | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [createDialogStatus, setCreateDialogStatus] = useState<string | null>(null)
  const ghostRef = useRef<HTMLDivElement | null>(null)

  // Clean up drag ghost on unmount
  useEffect(() => {
    return () => {
      if (ghostRef.current) {
        document.body.removeChild(ghostRef.current)
        ghostRef.current = null
      }
    }
  }, [])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['projects', projectId.toString()] })
  }

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => tasksApi.update(id, data),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: invalidate,
  })

  const reorderMutation = useMutation({
    mutationFn: tasksApi.reorder,
    onSuccess: invalidate,
  })

  // Group tasks by status, sorted by displayOrder
  const columns = COLUMN_ORDER.map((status) => ({
    status,
    tasks: tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.displayOrder - b.displayOrder),
  }))

  const handleDragStart = useCallback((task: Task, e: React.DragEvent) => {
    setDraggedTask(task)

    // Create custom drag ghost
    const ghost = document.createElement('div')
    ghost.textContent = task.title
    ghost.style.cssText = `
      position: fixed;
      top: -1000px;
      left: -1000px;
      max-width: 220px;
      padding: 8px 12px;
      background: hsl(var(--card));
      color: hsl(var(--card-foreground));
      border: 1px solid hsl(var(--primary) / 0.5);
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      pointer-events: none;
      z-index: 9999;
    `
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 110, 20)
    ghostRef.current = ghost

    // Clean up ghost after a frame (browser captures it immediately)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (ghostRef.current) {
          document.body.removeChild(ghostRef.current)
          ghostRef.current = null
        }
      })
    })
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null)
    setDropIndicator(null)
    setDragOverColumn(null)
    if (ghostRef.current) {
      document.body.removeChild(ghostRef.current)
      ghostRef.current = null
    }
  }, [])

  const handleDragOverCard = useCallback((e: React.DragEvent, task: Task) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const position: 'before' | 'after' = e.clientY < midY ? 'before' : 'after'

    setDropIndicator({ taskId: task.id, position })
  }, [])

  const handleDropOnCard = useCallback((e: React.DragEvent, targetTask: Task) => {
    e.preventDefault()
    if (!draggedTask || draggedTask.id === targetTask.id) {
      setDropIndicator(null)
      setDragOverColumn(null)
      return
    }

    const targetColumn = columns.find((c) => c.status === targetTask.status)
    if (!targetColumn) return

    // Determine the new ordered list for the target column
    const columnTasks = targetColumn.tasks.filter((t) => t.id !== draggedTask.id)
    const targetIndex = columnTasks.findIndex((t) => t.id === targetTask.id)
    const insertIndex = dropIndicator?.position === 'before' ? targetIndex : targetIndex + 1
    columnTasks.splice(insertIndex, 0, draggedTask)

    const taskIds = columnTasks.map((t) => t.id)

    // If moving across columns, update status first
    if (draggedTask.status !== targetTask.status) {
      updateMutation.mutate({ id: draggedTask.id, data: { status: targetTask.status } })
    }

    reorderMutation.mutate({ taskIds })

    setDraggedTask(null)
    setDropIndicator(null)
    setDragOverColumn(null)
  }, [draggedTask, dropIndicator, columns, updateMutation, reorderMutation])

  const handleDragOverColumn = useCallback((e: React.DragEvent, status: Task['status']) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
  }, [])

  const handleDragLeaveColumn = useCallback((e: React.DragEvent) => {
    // Only clear if actually leaving the column (not entering a child)
    const relatedTarget = e.relatedTarget as HTMLElement | null
    const currentTarget = e.currentTarget as HTMLElement
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      setDragOverColumn(null)
      setDropIndicator(null)
    }
  }, [])

  const makeColumnDropHandler = useCallback((status: Task['status']) => {
    return (e: React.DragEvent) => {
      e.preventDefault()
      if (!draggedTask) return

      const columnTasks = columns.find((c) => c.status === status)?.tasks ?? []
      const filteredTasks = columnTasks.filter((t) => t.id !== draggedTask.id)
      filteredTasks.push(draggedTask)

      const taskIds = filteredTasks.map((t) => t.id)

      if (draggedTask.status !== status) {
        updateMutation.mutate({ id: draggedTask.id, data: { status } })
      }

      reorderMutation.mutate({ taskIds })

      setDraggedTask(null)
      setDropIndicator(null)
      setDragOverColumn(null)
    }
  }, [draggedTask, columns, updateMutation, reorderMutation])

  const handleCardClick = useCallback((task: Task) => {
    setSelectedTask(task)
  }, [])

  const handleUpdateTask = useCallback((id: number, data: any) => {
    updateMutation.mutate({ id, data })
  }, [updateMutation])

  const handleDeleteTask = useCallback((id: number) => {
    deleteMutation.mutate(id)
  }, [deleteMutation])

  // Keep selectedTask in sync with latest task data
  const currentSelectedTask = selectedTask
    ? tasks.find((t) => t.id === selectedTask.id) ?? selectedTask
    : null

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(({ status, tasks: columnTasks }) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={columnTasks}
            draggedTaskId={draggedTask?.id ?? null}
            dropIndicator={dropIndicator}
            isDragOver={dragOverColumn === status && draggedTask !== null}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOverCard={handleDragOverCard}
            onDropOnCard={handleDropOnCard}
            onDragOverColumn={(e) => handleDragOverColumn(e, status)}
            onDragLeaveColumn={handleDragLeaveColumn}
            onDropOnColumn={makeColumnDropHandler(status)}
            onCardClick={handleCardClick}
            onAddTask={() => setCreateDialogStatus(status)}
          />
        ))}
      </div>

      <TaskDetailDialog
        task={currentSelectedTask}
        open={!!currentSelectedTask}
        onOpenChange={(open) => { if (!open) setSelectedTask(null) }}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        isUpdating={updateMutation.isPending}
      />

      <CreateTaskDialog
        open={!!createDialogStatus}
        onOpenChange={(open) => { if (!open) setCreateDialogStatus(null) }}
        projectId={projectId}
        defaultStatus={createDialogStatus ?? undefined}
      />
    </>
  )
}
