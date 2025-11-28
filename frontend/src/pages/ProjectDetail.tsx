import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '@/api/projects'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TaskList } from '@/components/TaskList'
import { IdeaList } from '@/components/IdeaList'
import { useState } from 'react'
import { CreateTaskDialog } from '@/components/CreateTaskDialog'
import { CreateIdeaDialog } from '@/components/CreateIdeaDialog'
import ReactMarkdown from 'react-markdown'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showCreateIdea, setShowCreateIdea] = useState(false)

  const { data: project, isLoading } = useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsApi.getById(Number(id)),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h2 className="text-2xl font-bold text-muted-foreground">Project not found</h2>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>

        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{project.title}</h1>
              <Badge variant={project.status === 'Active' ? 'default' : 'secondary'}>
                {project.status}
              </Badge>
            </div>
            {project.description && (
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <ReactMarkdown>{project.description}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
          <CardDescription>Overall completion status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                {project.completedTaskCount} of {project.taskCount} tasks completed
              </span>
              <span className="font-medium">{Math.round(project.progressPercentage)}%</span>
            </div>
            <Progress value={project.progressPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tasks" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="tasks">
              Tasks ({project.tasks.length})
            </TabsTrigger>
            <TabsTrigger value="ideas">
              Ideas ({project.ideas.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowCreateTask(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Task
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreateIdea(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Idea
            </Button>
          </div>
        </div>

        <TabsContent value="tasks" className="space-y-4">
          <TaskList tasks={project.tasks} projectId={project.id} />
        </TabsContent>

        <TabsContent value="ideas" className="space-y-4">
          <IdeaList ideas={project.ideas} projectId={project.id} />
        </TabsContent>
      </Tabs>

      <CreateTaskDialog
        open={showCreateTask}
        onOpenChange={setShowCreateTask}
        projectId={project.id}
      />

      <CreateIdeaDialog
        open={showCreateIdea}
        onOpenChange={setShowCreateIdea}
        projectId={project.id}
      />
    </div>
  )
}
