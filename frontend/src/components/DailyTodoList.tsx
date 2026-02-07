import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dailyTodosApi } from '@/api/dailyTodos'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, GripVertical, Pencil, X, Check } from 'lucide-react'
import type { DailyTodo } from '@/types'

export default function DailyTodoList() {
  const queryClient = useQueryClient()
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [newTodoDescription, setNewTodoDescription] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [draggedItem, setDraggedItem] = useState<DailyTodo | null>(null)

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ['dailyTodos'],
    queryFn: dailyTodosApi.getAll,
  })

  const createMutation = useMutation({
    mutationFn: dailyTodosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyTodos'] })
      setNewTodoTitle('')
      setNewTodoDescription('')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => dailyTodosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyTodos'] })
      setEditingId(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: dailyTodosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyTodos'] })
    },
  })

  const reorderMutation = useMutation({
    mutationFn: dailyTodosApi.reorder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyTodos'] })
    },
  })

  const handleCreate = () => {
    if (!newTodoTitle.trim()) return
    createMutation.mutate({
      title: newTodoTitle,
      description: newTodoDescription || undefined,
    })
  }

  const handleToggleComplete = (todo: DailyTodo) => {
    updateMutation.mutate({
      id: todo.id,
      data: { isCompleted: !todo.isCompleted },
    })
  }

  const handleStartEdit = (todo: DailyTodo) => {
    setEditingId(todo.id)
    setEditTitle(todo.title)
    setEditDescription(todo.description || '')
  }

  const handleSaveEdit = () => {
    if (!editingId || !editTitle.trim()) return
    updateMutation.mutate({
      id: editingId,
      data: {
        title: editTitle,
        description: editDescription || undefined,
      },
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleDragStart = (todo: DailyTodo) => {
    setDraggedItem(todo)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetTodo: DailyTodo) => {
    if (!draggedItem || draggedItem.id === targetTodo.id) return

    const reorderedTodos = [...todos]
    const draggedIndex = reorderedTodos.findIndex(t => t.id === draggedItem.id)
    const targetIndex = reorderedTodos.findIndex(t => t.id === targetTodo.id)

    reorderedTodos.splice(draggedIndex, 1)
    reorderedTodos.splice(targetIndex, 0, draggedItem)

    const todoIds = reorderedTodos.map(t => t.id)
    reorderMutation.mutate({ todoIds })
    setDraggedItem(null)
  }

  if (isLoading) {
    return (
      <Card className="h-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border-2 border-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
        <CardHeader className="border-b border-blue-500/30 bg-gradient-to-b from-blue-900/30 to-transparent">
          <CardTitle className="text-blue-400 font-bold tracking-wide" style={{ textShadow: '0 0 10px rgba(96,165,250,0.5), 0 0 20px rgba(96,165,250,0.3)' }}>
            Daily ToDo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-blue-300/70">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border-2 border-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3),0_0_40px_rgba(37,99,235,0.1)]">
      <CardHeader className="border-b border-blue-500/30 bg-gradient-to-b from-blue-900/30 to-transparent">
        <CardTitle className="text-blue-100 font-bold tracking-wide" style={{ textShadow: '0 0 10px rgba(96,165,250,0.55), 0 0 22px rgba(96,165,250,0.3)' }}>
          Daily ToDo
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4 overflow-y-auto">
        {/* Add new todo */}
        <div className="space-y-2 pb-4 border-b border-blue-500/30">
          <Input
            placeholder="New todo..."
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="bg-slate-950/70 border-blue-400/45 text-slate-50 placeholder:text-blue-200/75 focus:border-blue-300 focus:shadow-[0_0_0_1px_rgba(147,197,253,0.35),0_0_18px_rgba(59,130,246,0.35)] focus:ring-0"
          />
          <Textarea
            placeholder="Description (optional)"
            value={newTodoDescription}
            onChange={(e) => setNewTodoDescription(e.target.value)}
            rows={2}
            className="resize-none bg-slate-950/70 border-blue-400/45 text-slate-50 placeholder:text-blue-200/75 focus:border-blue-300 focus:shadow-[0_0_0_1px_rgba(147,197,253,0.35),0_0_18px_rgba(59,130,246,0.35)] focus:ring-0"
          />
          <Button
            onClick={handleCreate}
            className="w-full bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 border border-blue-500 text-blue-50 font-semibold shadow-[0_0_10px_rgba(59,130,246,0.3)] hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Todo
          </Button>
        </div>

        {/* Todo list */}
        <div className="space-y-2">
          {todos.length === 0 ? (
            <div
              className="text-center text-blue-100/80 py-8"
              style={{ textShadow: '0 0 14px rgba(147,197,253,0.22)' }}
            >
              No todos yet. Add one above!
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                draggable
                onDragStart={() => handleDragStart(todo)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(todo)}
                className="flex items-start gap-2 p-3 rounded-lg border border-blue-500/20 bg-gradient-to-br from-blue-900/15 to-slate-900/30 hover:from-blue-900/25 hover:to-slate-900/40 hover:border-blue-500/40 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all cursor-move"
              >
                <GripVertical className="h-5 w-5 text-blue-400/70 mt-0.5 flex-shrink-0" />

                <Checkbox
                  checked={todo.isCompleted}
                  onCheckedChange={() => handleToggleComplete(todo)}
                  className="mt-1 flex-shrink-0 border-blue-500/50 bg-slate-900/60 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-blue-600 data-[state=checked]:to-blue-700 data-[state=checked]:border-blue-500 data-[state=checked]:shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                />

                <div className="flex-1 min-w-0">
                  {editingId === todo.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-8 bg-slate-950/70 border-blue-400/45 text-slate-50 focus:border-blue-300 focus:shadow-[0_0_0_1px_rgba(147,197,253,0.35),0_0_18px_rgba(59,130,246,0.35)] focus:ring-0"
                      />
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        className="resize-none bg-slate-950/70 border-blue-400/45 text-slate-50 focus:border-blue-300 focus:shadow-[0_0_0_1px_rgba(147,197,253,0.35),0_0_18px_rgba(59,130,246,0.35)] focus:ring-0"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveEdit}
                          size="sm"
                          className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700 border border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          size="sm"
                          variant="outline"
                          className="border-blue-500/50 text-blue-300 hover:bg-blue-500/10 hover:border-blue-500 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`font-medium ${
                          todo.isCompleted ? 'line-through text-blue-200/60' : 'text-slate-50'
                        }`}
                      >
                        {todo.title}
                      </div>
                      {todo.description && (
                        <div
                          className={`text-sm mt-1 whitespace-pre-wrap break-words ${
                            todo.isCompleted ? 'line-through text-blue-200/45' : 'text-blue-100/75'
                          }`}
                        >
                          {todo.description}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {editingId !== todo.id && (
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      onClick={() => handleStartEdit(todo)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(todo.id)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
