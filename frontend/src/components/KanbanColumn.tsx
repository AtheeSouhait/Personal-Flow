import { Task } from '@/types'
import { Plus, AlertTriangle } from 'lucide-react'
import { Button } from './ui/button'
import { KanbanCard, DragPosition } from './KanbanCard'

// Soft work-in-progress cap: starting everything at once means finishing nothing
const WIP_LIMIT = 3

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
  const overWipLimit = status === 'InProgress' && tasks.length > WIP_LIMIT

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
          <span
            className={`text-xs font-medium ${
              overWipLimit ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground/60'
            }`}
          >
            {tasks.length}
            {status === 'InProgress' && ` / ${WIP_LIMIT}`}
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

      {overWipLimit && (
        <div className="mx-1 mb-2 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>
            {tasks.length} tasks in progress — consider finishing one before starting another.
          </span>
        </div>
      )}

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
