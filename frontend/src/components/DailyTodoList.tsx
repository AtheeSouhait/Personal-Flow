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
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Daily ToDo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Daily ToDo</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4 overflow-y-auto">
        {/* Add new todo */}
        <div className="space-y-2 pb-4 border-b">
          <Input
            placeholder="New todo..."
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Textarea
            placeholder="Description (optional)"
            value={newTodoDescription}
            onChange={(e) => setNewTodoDescription(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <Button onClick={handleCreate} className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Todo
          </Button>
        </div>

        {/* Todo list */}
        <div className="space-y-2">
          {todos.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
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
                className="flex items-start gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-move"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />

                <Checkbox
                  checked={todo.isCompleted}
                  onCheckedChange={() => handleToggleComplete(todo)}
                  className="mt-1 flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  {editingId === todo.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-8"
                      />
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleSaveEdit} size="sm" variant="default">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button onClick={handleCancelEdit} size="sm" variant="outline">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`font-medium ${
                          todo.isCompleted ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {todo.title}
                      </div>
                      {todo.description && (
                        <div
                          className={`text-sm text-muted-foreground mt-1 ${
                            todo.isCompleted ? 'line-through' : ''
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
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(todo.id)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
