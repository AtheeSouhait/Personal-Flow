import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { dailyTodosApi } from '@/api/dailyTodos'
import { ideasApi } from '@/api/ideas'
import { projectsApi } from '@/api/projects'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Zap } from 'lucide-react'

interface QuickCaptureProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Zero-friction capture: dump a thought before it evaporates.
// Saves to the Daily ToDo list by default, or as an idea on a project.
export function QuickCapture({ open, onOpenChange }: QuickCaptureProps) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('daily')
  const [saved, setSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
    enabled: open,
  })

  useEffect(() => {
    if (open) {
      setSaved(false)
      // Radix moves focus on open; queue ours after it settles
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const todoMutation = useMutation({
    mutationFn: dailyTodosApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dailyTodos'] }),
  })

  const ideaMutation = useMutation({
    mutationFn: ideasApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })

  const handleSave = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    if (target === 'daily') {
      todoMutation.mutate({ title: trimmed })
    } else {
      ideaMutation.mutate({ title: trimmed, projectId: parseInt(target) })
    }
    setTitle('')
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] top-[30%]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Quick capture
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <Input
            ref={inputRef}
            placeholder="What's on your mind?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
          />
          <div className="flex items-center gap-2">
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily ToDo</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>
                    Idea → {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSave} disabled={!title.trim()}>
              Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {saved ? 'Saved! Capture another or press Esc to close.' : 'Enter to save · Esc to close · Ctrl+K to open from anywhere'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
