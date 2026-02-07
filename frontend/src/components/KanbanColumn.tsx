import { Task } from '@/types'
import { Plus } from 'lucide-react'
import { Button } from './ui/button'
import { KanbanCard, DragPosition } from './KanbanCard'

const statusConfig = {
  NotStarted: { label: 'Not Started', color: 'bg-gray-500', ring: 'ring-gray-500/30' },
  InProgress: { label: 'In Progress', color: 'bg-blue-500', ring: 'ring-blue-500/30' },
  Completed: { label: 'Completed', color: 'bg-green-500', ring: 'ring-green-500/30' },
  Blocked: { label: 'Blocked', color: 'bg-red-500', ring: 'ring-red-500/30' },
}

interface KanbanColumnProps {
  status: Task['status']
  tasks: Task[]
  draggedTaskId: number | null
  dropIndicator: DragPosition | null
  isDragOver: boolean
  onDragStart: (task: Task, e: React.DragEvent) => void
  onDragEnd: () => void
  onDragOverCard: (e: React.DragEvent, task: Task) => void
  onDropOnCard: (e: React.DragEvent, task: Task) => void
  onDragOverColumn: (e: React.DragEvent) => void
  onDragLeaveColumn: (e: React.DragEvent) => void
  onDropOnColumn: (e: React.DragEvent) => void
  onCardClick: (task: Task) => void
  onAddTask: () => void
}

export function KanbanColumn({
  status,
  tasks,
  draggedTaskId,
  dropIndicator,
  isDragOver,
  onDragStart,
  onDragEnd,
  onDragOverCard,
  onDropOnCard,
  onDragOverColumn,
  onDragLeaveColumn,
  onDropOnColumn,
  onCardClick,
  onAddTask,
}: KanbanColumnProps) {
  const config = statusConfig[status]

  return (
    <div
      className={`
        flex flex-col min-w-[260px] flex-1 max-h-[calc(100vh-320px)]
        rounded-xl transition-all duration-200
        ${isDragOver
          ? `bg-accent/30 ring-2 ${config.ring}`
          : ''
        }
      `}
    >
      <div className="flex items-center justify-between mb-3 px-2 pt-1">
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
        className="flex-1 overflow-y-auto space-y-2 px-1 pb-2"
        onDragOver={onDragOverColumn}
        onDragLeave={onDragLeaveColumn}
        onDrop={onDropOnColumn}
      >
        {tasks.length === 0 ? (
          <div
            className={`
              border-2 border-dashed rounded-lg p-6 flex items-center justify-center min-h-[80px]
              transition-all duration-200
              ${isDragOver
                ? 'border-primary/40 bg-primary/5'
                : 'border-muted-foreground/20'
              }
            `}
          >
            <span className={`text-sm ${isDragOver ? 'text-primary/60' : 'text-muted-foreground/40'}`}>
              {isDragOver ? 'Drop here' : 'Drop tasks here'}
            </span>
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
