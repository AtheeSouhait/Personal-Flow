import { useRef } from 'react'
import { Task } from '@/types'
import { Flag, Calendar, CheckSquare, Timer } from 'lucide-react'
import { format } from 'date-fns'
import { getDueUrgency, urgencyChipClasses, urgencyLabels, formatMinutes } from '@/lib/urgency'

const priorityColors = {
  Low: 'text-gray-400',
  Medium: 'text-blue-500',
  High: 'text-orange-500',
  Critical: 'text-red-500',
}

const priorityStripeColors = {
  Low: 'bg-gray-400',
  Medium: 'bg-blue-500',
  High: 'bg-orange-500',
  Critical: 'bg-red-500',
}

const progressBarColors = {
  NotStarted: 'bg-gray-400',
  InProgress: 'bg-blue-500',
  Completed: 'bg-green-500',
  Blocked: 'bg-red-500',
}

import { Link } from 'react-router-dom'

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
  showProjectLink?: boolean
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
  showProjectLink,
}: KanbanCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const showBeforeGap = dropIndicator?.taskId === task.id && dropIndicator.position === 'before'
  const showAfterGap = dropIndicator?.taskId === task.id && dropIndicator.position === 'after'
  const statusColor = progressBarColors[task.status]
  const urgency = task.status === 'Completed' ? 'none' : getDueUrgency(task.dueDate)
  const subtaskDone = task.subtasks?.filter((s) => s.isCompleted).length ?? 0
  const subtaskTotal = task.subtasks?.length ?? 0

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
          bg-card border rounded-lg overflow-hidden cursor-pointer select-none
          hover:border-primary/50 hover:shadow-sm
          transition-all duration-200 ease-out flex
          ${urgency === 'overdue' ? 'border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.25)]' : ''}
          ${urgency === 'today' ? 'border-amber-500/60' : ''}
          ${isDragging ? 'opacity-30 scale-[0.97] border-dashed border-primary/40' : ''}
        `}
      >
        <div className={`w-1 flex-shrink-0 rounded-l-lg ${priorityStripeColors[task.priority]}`} />
        <div className="flex-1 p-3">
        <div className="flex items-start gap-2 mb-1">
          <span className="text-sm font-medium flex-1 line-clamp-2">
            {task.title}
            {showProjectLink && task.projectTitle && (
              <span className="ml-1 text-muted-foreground font-normal text-xs whitespace-nowrap">
                (
                <Link
                  to={`/projects/${task.projectId}`}
                  className="hover:underline hover:text-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {task.projectTitle}
                </Link>
                )
              </span>
            )}
          </span>
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

        {(task.dueDate || subtaskTotal > 0 || task.estimatedMinutes) && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {task.dueDate && (
              <span
                className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
                  urgency === 'none' ? 'text-muted-foreground' : urgencyChipClasses[urgency]
                }`}
              >
                <Calendar className="h-3 w-3" />
                {urgency !== 'none' && urgencyLabels[urgency]
                  ? `${urgencyLabels[urgency]} · ${format(new Date(task.dueDate), 'MMM d')}`
                  : format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
            {subtaskTotal > 0 && (
              <span
                className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
                  subtaskDone === subtaskTotal
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-muted-foreground'
                }`}
              >
                <CheckSquare className="h-3 w-3" />
                {subtaskDone}/{subtaskTotal}
              </span>
            )}
            {task.estimatedMinutes ? (
              <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded text-muted-foreground">
                <Timer className="h-3 w-3" />
                {formatMinutes(task.estimatedMinutes)}
              </span>
            ) : null}
          </div>
        )}
        </div>
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
