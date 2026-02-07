import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '@/api/projects'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, GripVertical, Lightbulb, ListTodo } from 'lucide-react'
import DailyTodoList from '@/components/DailyTodoList'
import type { Project } from '@/types'

export default function Dashboard() {
  const queryClient = useQueryClient()
  const [draggedItem, setDraggedItem] = useState<Project | null>(null)

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  })

  const reorderMutation = useMutation({
    mutationFn: projectsApi.reorder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const handleDragStart = (project: Project) => {
    setDraggedItem(project)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetProject: Project) => {
    if (!draggedItem || draggedItem.id === targetProject.id || !projects) return

    const reordered = [...projects]
    const draggedIndex = reordered.findIndex(p => p.id === draggedItem.id)
    const targetIndex = reordered.findIndex(p => p.id === targetProject.id)

    reordered.splice(draggedIndex, 1)
    reordered.splice(targetIndex, 0, draggedItem)

    const projectIds = reordered.map(p => p.id)
    reorderMutation.mutate({ projectIds })
    setDraggedItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading projects...</div>
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground">No projects yet</h2>
          <p className="text-muted-foreground mt-2">
            Create your first project to get started
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your projects and track progress
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Projects section - 2/3 width */}
        <div className="flex-1 w-2/3">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2">
            {projects.map((project) => (
              <div
                key={project.id}
                draggable
                onDragStart={() => handleDragStart(project)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(project)}
                onDragEnd={handleDragEnd}
                className={`transition-opacity ${draggedItem?.id === project.id ? 'opacity-50' : ''}`}
              >
              <Link to={`/projects/${project.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1">
                        <GripVertical
                          className="h-5 w-5 text-muted-foreground/50 flex-shrink-0 cursor-grab"
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                        <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                      </div>
                      <Badge
                        variant={project.status === 'Active' ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {project.status}
                      </Badge>
                    </div>
                    {project.description && (
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{Math.round(project.progressPercentage)}%</span>
                      </div>
                      <Progress value={project.progressPercentage} />
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <ListTodo className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-medium">{project.taskCount}</p>
                          <p className="text-xs text-muted-foreground">Tasks</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="font-medium">{project.completedTaskCount}</p>
                          <p className="text-xs text-muted-foreground">Done</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        <div>
                          <p className="font-medium">{project.ideaCount}</p>
                          <p className="text-xs text-muted-foreground">Ideas</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Todo section - 1/3 width */}
        <div className="w-1/3 min-w-[320px]">
          <DailyTodoList />
        </div>
      </div>
    </div>
  )
}
