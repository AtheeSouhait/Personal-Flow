import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Clock3, NotebookPen, Play, Plus, Square, Trash2 } from 'lucide-react'

type ActivityEntry = {
  id: string
  activity: string
  duration: string
  elapsedSeconds?: number
  notes: string[]
}

type ActivityByDate = Record<string, ActivityEntry[]>

const STORAGE_KEY = 'activity-tracker-v1'

const isValidDuration = (duration: string) => /^\d{1,3}:[0-5]\d$/.test(duration)

const durationToSeconds = (duration: string) => {
  if (!isValidDuration(duration)) return 0

  const [hours, minutes] = duration.split(':').map(Number)
  return ((hours * 60) + minutes) * 60
}

const secondsToDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

const secondsToStopwatch = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainingSeconds = safeSeconds % 60

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    remainingSeconds.toString().padStart(2, '0'),
  ].join(':')
}

export default function ActivityTracker() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [activityName, setActivityName] = useState('')
  const [duration, setDuration] = useState('00:00')
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({})
  const [editingNote, setEditingNote] = useState<Record<string, number | null>>({})
  const [activitiesByDate, setActivitiesByDate] = useState<ActivityByDate>({})
  const [runningTimer, setRunningTimer] = useState<{ date: string, activityId: string } | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      setIsHydrated(true)
      return
    }

    try {
      const parsed = JSON.parse(raw) as ActivityByDate
      setActivitiesByDate(parsed)
    } catch {
      setActivitiesByDate({})
    } finally {
      setIsHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    localStorage.setItem(STORAGE_KEY, JSON.stringify(activitiesByDate))
  }, [activitiesByDate, isHydrated])

  useEffect(() => {
    if (!runningTimer) return

    const interval = window.setInterval(() => {
      setActivitiesByDate(prev => ({
        ...prev,
        [runningTimer.date]: (prev[runningTimer.date] ?? []).map((entry) => {
          if (entry.id !== runningTimer.activityId) return entry

          const nextSeconds = (entry.elapsedSeconds ?? durationToSeconds(entry.duration)) + 1
          return {
            ...entry,
            duration: secondsToDuration(nextSeconds),
            elapsedSeconds: nextSeconds,
          }
        }),
      }))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [runningTimer])

  const activities = useMemo(() => activitiesByDate[selectedDate] ?? [], [activitiesByDate, selectedDate])

  const addActivity = () => {
    if (!activityName.trim() || !isValidDuration(duration)) return

    const next: ActivityEntry = {
      id: crypto.randomUUID(),
      activity: activityName.trim(),
      duration,
      elapsedSeconds: durationToSeconds(duration),
      notes: [],
    }

    setActivitiesByDate(prev => ({
      ...prev,
      [selectedDate]: [next, ...(prev[selectedDate] ?? [])],
    }))

    setActivityName('')
    setDuration('00:00')
  }

  const updateActivity = (activityId: string, updater: (entry: ActivityEntry) => ActivityEntry) => {
    setActivitiesByDate(prev => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] ?? []).map(entry => entry.id === activityId ? updater(entry) : entry),
    }))
  }

  const deleteActivity = (activityId: string) => {
    setRunningTimer(prev => prev?.activityId === activityId && prev.date === selectedDate ? null : prev)
    setActivitiesByDate(prev => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] ?? []).filter(entry => entry.id !== activityId),
    }))
  }

  const toggleTimer = (activityId: string) => {
    setRunningTimer(prev => (
      prev?.activityId === activityId && prev.date === selectedDate
        ? null
        : { date: selectedDate, activityId }
    ))
  }

  const upsertNote = (activityId: string) => {
    const draft = (noteDraft[activityId] ?? '').trim()
    if (!draft) return

    const editingIndex = editingNote[activityId]

    updateActivity(activityId, (entry) => {
      if (editingIndex === undefined || editingIndex === null) {
        return { ...entry, notes: [...entry.notes, draft] }
      }

      const nextNotes = [...entry.notes]
      nextNotes[editingIndex] = draft
      return { ...entry, notes: nextNotes }
    })

    setNoteDraft(prev => ({ ...prev, [activityId]: '' }))
    setEditingNote(prev => ({ ...prev, [activityId]: null }))
  }

  const startEditNote = (activityId: string, index: number, value: string) => {
    setEditingNote(prev => ({ ...prev, [activityId]: index }))
    setNoteDraft(prev => ({ ...prev, [activityId]: value }))
  }

  const deleteNote = (activityId: string, index: number) => {
    updateActivity(activityId, (entry) => ({
      ...entry,
      notes: entry.notes.filter((_, i) => i !== index),
    }))
  }

  return (
    <Card className="h-full border-violet-200/60 bg-gradient-to-b from-white to-violet-50/30 dark:from-slate-950 dark:to-slate-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-violet-500" /> Activity Tracker</CardTitle>
        <CardDescription>Ajoute des activités journalières et lance un timer pour cumuler le temps.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <label className="text-xs font-medium text-muted-foreground">Date</label>
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>

        <div className="grid gap-2 md:grid-cols-[1fr_110px_auto] md:items-end">
          <div className="grid gap-1">
            <label className="text-xs font-medium text-muted-foreground">Activité</label>
            <Input placeholder="Ex: Sport, Deep work..." value={activityName} onChange={(e) => setActivityName(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-medium text-muted-foreground">Durée (hh:mm)</label>
            <Input placeholder="00:00" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <Button onClick={addActivity} className="md:mb-[2px]">
            <Plus className="mr-1 h-4 w-4" /> Ajouter
          </Button>
        </div>

        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {activities.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune activité pour cette date.</p>
          )}
          {activities.map((entry) => (
            <div key={entry.id} className="rounded-xl border bg-background/90 p-3 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{entry.activity}</p>
                  <p className="font-mono text-sm font-semibold tabular-nums">
                    {secondsToStopwatch(entry.elapsedSeconds ?? durationToSeconds(entry.duration))}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant={runningTimer?.activityId === entry.id && runningTimer.date === selectedDate ? 'secondary' : 'outline'}
                    size="icon"
                    onClick={() => toggleTimer(entry.id)}
                    title={runningTimer?.activityId === entry.id && runningTimer.date === selectedDate ? 'Stop' : 'Play'}
                  >
                    {runningTimer?.activityId === entry.id && runningTimer.date === selectedDate ? (
                      <Square className="h-4 w-4 text-amber-600" />
                    ) : (
                      <Play className="h-4 w-4 text-emerald-600" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteActivity(entry.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {entry.notes.map((note, noteIndex) => (
                  <div key={`${entry.id}-${noteIndex}`} className="flex items-start justify-between gap-2 rounded-lg border p-2">
                    <p className="text-sm whitespace-pre-wrap">{note}</p>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => startEditNote(entry.id, noteIndex, note)}>
                        Editer
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteNote(entry.id, noteIndex)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><NotebookPen className="h-3.5 w-3.5" />Note</label>
                <Textarea
                  rows={2}
                  placeholder="Ajouter un détail, un ressenti, un résultat..."
                  value={noteDraft[entry.id] ?? ''}
                  onChange={(e) => setNoteDraft(prev => ({ ...prev, [entry.id]: e.target.value }))}
                />
                <Button size="sm" variant="secondary" onClick={() => upsertNote(entry.id)}>
                  {editingNote[entry.id] === null || editingNote[entry.id] === undefined ? 'Ajouter la note' : 'Mettre à jour la note'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
