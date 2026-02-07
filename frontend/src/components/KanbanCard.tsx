import { useRef } from 'react'
import { Task } from '@/types'
import { Flag, Calendar } from 'lucide-react'
import { format } from 'date-fns'

const priorityColors = {
  Low: 'text-gray-400',
  Medium: 'text-blue-500',
  High: 'text-orange-500',
  Critical: 'text-red-500',
}

const progressBarColors = {
  NotStarted: 'bg-gray-400',
  InProgress: 'bg-blue-500',
  Completed: 'bg-green-500',
  Blocked: 'bg-red-500',
}

export interface DragPosition {
  taskId: number
  position: 'before' | 'after'
}

interface KanbanCardProps {
  task: Task
  isDragging: boolean
  dropIndicator: DragPosition | null
  onDragStart: (task: Task, e: React.DragEvent) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent, task: Task) => void
  onDrop: (e: React.DragEvent, task: Task) => void
  onClick: (task: Task) => void
}

export function KanbanCard({
  task,
  isDragging,
  dropIndicator,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onClick,
}: KanbanCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const showBeforeGap = dropIndicator?.taskId === task.id && dropIndicator.position === 'before'
  const showAfterGap = dropIndicator?.taskId === task.id && dropIndicator.position === 'after'
  const statusColor = progressBarColors[task.status]

  return (
    <div className="relative">
      {/* Animated gap before card */}
      <div
        className={`transition-all duration-200 ease-out overflow-hidden ${
          showBeforeGap ? 'h-12 mb-1' : 'h-0'
        }`}
      >
        <div className={`h-full rounded-lg border-2 border-dashed border-primary/30 bg-primary/5`} />
      </div>

      <div
        ref={cardRef}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move'
          onDragStart(task, e)
        }}
        onDragEnd={onDragEnd}
        onDragOver={(e) => { e.stopPropagation(); onDragOver(e, task) }}
        onDrop={(e) => { e.stopPropagation(); onDrop(e, task) }}
        onClick={() => onClick(task)}
        className={`
          bg-card border rounded-lg p-3 cursor-pointer select-none
          hover:border-primary/50 hover:shadow-sm
          transition-all duration-200 ease-out
          ${isDragging ? 'opacity-30 scale-[0.97] border-dashed border-primary/40' : ''}
        `}
      >
        <div className="flex items-start gap-2 mb-1">
          <span className="text-sm font-medium flex-1 line-clamp-2">{task.title}</span>
          <Flag className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${priorityColors[task.priority]}`} />
        </div>

        {task.progressPercentage > 0 && (
          <div className="w-full bg-muted rounded-full h-1 mt-2">
            <div
              className={`h-1 rounded-full transition-all ${statusColor}`}
              style={{ width: `${task.progressPercentage}%` }}
            />
          </div>
        )}

        {task.dueDate && (
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(task.dueDate), 'MMM d')}
          </div>
        )}
      </div>

      {/* Animated gap after card */}
      <div
        className={`transition-all duration-200 ease-out overflow-hidden ${
          showAfterGap ? 'h-12 mt-1' : 'h-0'
        }`}
      >
        <div className={`h-full rounded-lg border-2 border-dashed border-primary/30 bg-primary/5`} />
      </div>
    </div>
  )
}
