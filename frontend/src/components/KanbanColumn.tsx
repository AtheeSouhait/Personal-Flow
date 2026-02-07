import { Task } from '@/types'
import { Plus } from 'lucide-react'
import { Button } from './ui/button'
import { KanbanCard, DragPosition } from './KanbanCard'

const statusConfig = {
  NotStarted: { label: 'Not Started', color: 'bg-gray-500' },
  InProgress: { label: 'In Progress', color: 'bg-blue-500' },
  Completed: { label: 'Completed', color: 'bg-green-500' },
  Blocked: { label: 'Blocked', color: 'bg-red-500' },
}

interface KanbanColumnProps {
  status: Task['status']
  tasks: Task[]
  draggedTaskId: number | null
  dropIndicator: DragPosition | null
  onDragStart: (task: Task) => void
  onDragEnd: () => void
  onDragOverCard: (e: React.DragEvent, task: Task) => void
  onDropOnCard: (e: React.DragEvent, task: Task) => void
  onDragOverColumn: (e: React.DragEvent) => void
  onDropOnColumn: (e: React.DragEvent) => void
  onCardClick: (task: Task) => void
  onAddTask: () => void
}

export function KanbanColumn({
  status,
  tasks,
  draggedTaskId,
  dropIndicator,
  onDragStart,
  onDragEnd,
  onDragOverCard,
  onDropOnCard,
  onDragOverColumn,
  onDropOnColumn,
  onCardClick,
  onAddTask,
}: KanbanColumnProps) {
  const config = statusConfig[status]

  return (
    <div className="flex flex-col min-w-[260px] flex-1 max-h-[calc(100vh-320px)]">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            {config.label}
          </h3>
          <span className="text-xs text-muted-foreground/60 font-medium">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onAddTask}
          title={`Add task to ${config.label}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div
        className="flex-1 overflow-y-auto space-y-2 p-1"
        onDragOver={onDragOverColumn}
        onDrop={onDropOnColumn}
      >
        {tasks.length === 0 ? (
          <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 flex items-center justify-center min-h-[80px]">
            <span className="text-sm text-muted-foreground/40">Drop tasks here</span>
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              isDragging={draggedTaskId === task.id}
              dropIndicator={dropIndicator}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOverCard}
              onDrop={onDropOnCard}
              onClick={onCardClick}
            />
          ))
        )}
      </div>
    </div>
  )
}
