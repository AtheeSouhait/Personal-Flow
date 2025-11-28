import { Idea } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ideasApi } from '@/api/ideas'
import { Lightbulb, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { format } from 'date-fns'

interface IdeaListProps {
  ideas: Idea[]
  projectId: number
}

export function IdeaList({ ideas, projectId }: IdeaListProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: ideasApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId.toString()] })
    },
  })

  if (ideas.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
          No ideas yet. Capture your first idea!
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {ideas.map((idea) => (
        <Card key={idea.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 flex-1">
                <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <CardTitle className="text-base">{idea.title}</CardTitle>
                  {idea.description && (
                    <CardDescription className="mt-2 line-clamp-3">
                      {idea.description}
                    </CardDescription>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate(idea.id)}
                className="text-destructive hover:text-destructive -mt-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {format(new Date(idea.createdAt), 'MMM d, yyyy')}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
