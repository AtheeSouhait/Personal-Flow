import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '@/api/projects'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { AlertTriangle } from 'lucide-react'

interface DeleteProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: number
  projectTitle: string
  taskCount: number
  ideaCount: number
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  projectId,
  projectTitle,
  taskCount,
  ideaCount
}: DeleteProjectDialogProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.delete(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      onOpenChange(false)
      navigate('/')
    },
  })

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
            </div>
            <DialogTitle>Delete Project</DialogTitle>
          </div>
          <DialogDescription className="pt-3">
            Are you sure you want to delete <strong>"{projectTitle}"</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. This will permanently delete:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2">
            <li>The project and all its data</li>
            <li><strong>{taskCount}</strong> task{taskCount !== 1 ? 's' : ''}</li>
            <li><strong>{ideaCount}</strong> idea{ideaCount !== 1 ? 's' : ''}</li>
          </ul>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
