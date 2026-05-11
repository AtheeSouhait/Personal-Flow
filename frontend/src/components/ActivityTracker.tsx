import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart3, Clock3, NotebookPen, PencilLine, Play, Plus, Save, SlidersHorizontal, Square, TimerReset, Trash2, X } from 'lucide-react'
import { activitiesApi } from '@/api/activities'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { ActivityEntry } from '@/types'

type RunningTimer = {
  date: string
  activityId: number
}

type LocalActivityTrackerData = {
  activities?: Array<{
    id: string
    activity: string
    goalSeconds?: number
    goalPeriod?: 'daily' | 'weekly'
    goalType?: 'target' | 'limit'
  }>
  entriesByDate?: Record<string, Record<string, {
    elapsedSeconds?: number
    duration?: string
    notes?: string[]
  }>>
}

type LocalLegacyActivityEntry = {
  id: string
  activity: string
  elapsedSeconds?: number
  duration?: string
  goalSeconds?: number
  goalPeriod?: 'daily' | 'weekly'
  goalType?: 'target' | 'limit'
  notes?: string[]
}

const LEGACY_STORAGE_KEY = 'activity-tracker-v1'
const DB_MIGRATION_KEY = 'activity-tracker-db-migrated-v1'

const activityAccents = ['#6f6ab7', '#d79a4b', '#4ba9bd', '#b85a57', '#7aa66a']

const getTimerKey = (timer: RunningTimer) => `${timer.date}:${timer.activityId}`

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

const formatDurationLabel = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainingSeconds = safeSeconds % 60

  if (hours > 0) return `${hours} hr ${minutes} min`
  if (minutes > 0) return `${minutes} min ${remainingSeconds} sec`
  return `${remainingSeconds} sec`
}

const getWeekKey = (dateValue: string) => {
  const date = new Date(`${dateValue}T00:00:00`)
  const day = date.getDay() || 7
  date.setDate(date.getDate() - day + 1)
  return date.toISOString().split('T')[0]
}

const getWeekDates = (dateValue: string) => {
  const start = new Date(`${getWeekKey(dateValue)}T00:00:00`)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date.toISOString().split('T')[0]
  })
}

export default function ActivityTracker() {
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [activityName, setActivityName] = useState('')
  const [duration, setDuration] = useState('00:00')
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({})
  const [editingNote, setEditingNote] = useState<Record<string, number | null>>({})
  const [runningTimers, setRunningTimers] = useState<RunningTimer[]>([])
  const [detailsActivityId, setDetailsActivityId] = useState<number | null>(null)
  const [goalEditorActivityId, setGoalEditorActivityId] = useState<number | null>(null)
  const [goalDraft, setGoalDraft] = useState<Record<string, { duration: string, period: 'daily' | 'weekly', type: 'target' | 'limit' }>>({})
  const [timeEditorActivityId, setTimeEditorActivityId] = useState<number | null>(null)
  const [timeDraft, setTimeDraft] = useState<Record<string, string>>({})
  const lastTimerSaveRef = useRef<Record<string, number>>({})
  const hasStartedLocalImportRef = useRef(false)

  const activityQueryKey = useMemo(() => ['activities', selectedDate], [selectedDate])

  const { data: activities = [], isLoading } = useQuery({
    queryKey: activityQueryKey,
    queryFn: () => activitiesApi.getForDate(selectedDate),
  })

  const logsByWeekQuery = useQuery({
    queryKey: ['activities-week', getWeekKey(selectedDate)],
    queryFn: async () => {
      const entriesByDay = await Promise.all(getWeekDates(selectedDate).map(date => activitiesApi.getForDate(date)))
      return entriesByDay.flat()
    },
  })

  const createMutation = useMutation({
    mutationFn: ({ date, activity, elapsedSeconds }: { date: string, activity: string, elapsedSeconds: number }) => (
      activitiesApi.create(date, { activity, elapsedSeconds, notes: [] })
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      setActivityName('')
      setDuration('00:00')
    },
  })

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, goalSeconds, goalPeriod, goalType }: { id: number, goalSeconds?: number, goalPeriod?: 'daily' | 'weekly', goalType?: 'target' | 'limit' }) => (
      activitiesApi.updateGoal(id, { goalSeconds, goalPeriod, goalType })
    ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities'] }),
  })

  const upsertLogMutation = useMutation({
    mutationFn: ({ id, date, elapsedSeconds, notes }: { id: number, date: string, elapsedSeconds: number, notes: string[] }) => (
      activitiesApi.upsertLog(id, date, { elapsedSeconds, notes })
    ),
    onSuccess: (_entry, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activities', variables.date] })
      queryClient.invalidateQueries({ queryKey: ['activities-week'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: activitiesApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities'] }),
  })

  useEffect(() => {
    if (hasStartedLocalImportRef.current || localStorage.getItem(DB_MIGRATION_KEY)) return

    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(DB_MIGRATION_KEY, 'true')
      return
    }

    hasStartedLocalImportRef.current = true

    const importLocalActivities = async () => {
      const parsed = JSON.parse(raw) as LocalActivityTrackerData
      const definitions = parsed.activities ?? []
      const entriesByDate = parsed.entriesByDate ?? {}

      if (definitions.length === 0 && Object.keys(entriesByDate).length === 0) {
        const legacyByDate = JSON.parse(raw) as Record<string, LocalLegacyActivityEntry[]>

        for (const [date, entries] of Object.entries(legacyByDate)) {
          if (!Array.isArray(entries)) continue

          for (const entry of entries) {
            if (!entry.activity?.trim()) continue

            const importedEntry = await activitiesApi.create(date, {
              activity: entry.activity,
              elapsedSeconds: entry.elapsedSeconds ?? durationToSeconds(entry.duration ?? '00:00'),
              notes: entry.notes ?? [],
            })

            if (entry.goalSeconds) {
              await activitiesApi.updateGoal(importedEntry.id, {
                goalSeconds: entry.goalSeconds,
                goalPeriod: entry.goalPeriod,
                goalType: entry.goalType,
              })
            }
          }
        }

        localStorage.setItem(DB_MIGRATION_KEY, 'true')
        queryClient.invalidateQueries({ queryKey: ['activities'] })
        return
      }

      for (const activity of definitions) {
        if (!activity.activity.trim()) continue

        for (const [date, entries] of Object.entries(entriesByDate)) {
          const entry = entries[activity.id]
          if (!entry) continue

          const importedEntry = await activitiesApi.create(date, {
            activity: activity.activity,
            elapsedSeconds: entry.elapsedSeconds ?? durationToSeconds(entry.duration ?? '00:00'),
            notes: entry.notes ?? [],
          })

          if (activity.goalSeconds) {
            await activitiesApi.updateGoal(importedEntry.id, {
              goalSeconds: activity.goalSeconds,
              goalPeriod: activity.goalPeriod,
              goalType: activity.goalType,
            })
          }
        }
      }

      localStorage.setItem(DB_MIGRATION_KEY, 'true')
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    }

    importLocalActivities().catch((error) => {
      hasStartedLocalImportRef.current = false
      console.error('Activity import failed:', error)
    })
  }, [queryClient])

  const saveLog = (entry: ActivityEntry, date = selectedDate) => {
    upsertLogMutation.mutate({
      id: entry.id,
      date,
      elapsedSeconds: entry.elapsedSeconds,
      notes: entry.notes,
    })
  }

  useEffect(() => {
    if (runningTimers.length === 0) return

    const interval = window.setInterval(() => {
      runningTimers.forEach((timer) => {
        const key = ['activities', timer.date]

        queryClient.setQueryData<ActivityEntry[]>(key, (previous = []) => (
          previous.map((entry) => {
            if (entry.id !== timer.activityId) return entry

            const nextSeconds = entry.elapsedSeconds + 1
            const nextEntry = {
              ...entry,
              duration: secondsToDuration(nextSeconds),
              elapsedSeconds: nextSeconds,
            }
            const timerKey = getTimerKey(timer)
            const now = Date.now()

            if (!lastTimerSaveRef.current[timerKey] || now - lastTimerSaveRef.current[timerKey] >= 5000) {
              lastTimerSaveRef.current[timerKey] = now
              saveLog(nextEntry, timer.date)
            }

            return nextEntry
          })
        ))
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [queryClient, runningTimers])

  const getActivityTotalForGoal = (entry: ActivityEntry) => {
    if (entry.goalPeriod !== 'weekly') return entry.elapsedSeconds

    return logsByWeekQuery.data
      ?.filter(candidate => candidate.id === entry.id)
      .reduce((total, candidate) => total + candidate.elapsedSeconds, 0) ?? entry.elapsedSeconds
  }

  const getGoalSummary = (entry: ActivityEntry) => {
    if (!entry.goalSeconds) return 'No goal set'

    const remaining = Math.max(entry.goalSeconds - getActivityTotalForGoal(entry), 0)
    const period = entry.goalPeriod === 'weekly' ? 'weekly' : 'daily'
    const kind = entry.goalType === 'limit' ? 'limit' : 'target'

    if (remaining === 0) return `${period} ${kind} reached`
    return `${formatDurationLabel(remaining)} left for ${period} ${kind}`
  }

  const getGoalProgress = (entry: ActivityEntry) => {
    if (!entry.goalSeconds) return 0
    return Math.min(100, Math.round((getActivityTotalForGoal(entry) / entry.goalSeconds) * 100))
  }

  const addActivity = () => {
    if (!activityName.trim() || !isValidDuration(duration)) return

    createMutation.mutate({
      date: selectedDate,
      activity: activityName.trim(),
      elapsedSeconds: durationToSeconds(duration),
    })
  }

  const replaceActivityInCache = (activityId: number, updater: (entry: ActivityEntry) => ActivityEntry) => {
    queryClient.setQueryData<ActivityEntry[]>(activityQueryKey, (previous = []) => (
      previous.map(entry => entry.id === activityId ? updater(entry) : entry)
    ))
  }

  const deleteActivity = (activityId: number) => {
    setRunningTimers(prev => prev.filter(timer => timer.activityId !== activityId))
    deleteMutation.mutate(activityId)
  }

  const toggleTimer = (activityId: number) => {
    const timer = { date: selectedDate, activityId }
    const timerKey = getTimerKey(timer)
    const existingTimer = runningTimers.some(candidate => getTimerKey(candidate) === timerKey)

    if (existingTimer) {
      const entry = activities.find(candidate => candidate.id === activityId)
      if (entry) saveLog(entry)
    }

    setRunningTimers(prev => (
      existingTimer
        ? prev.filter(candidate => getTimerKey(candidate) !== timerKey)
        : [...prev, timer]
    ))
  }

  const openGoalEditor = (entry: ActivityEntry) => {
    setGoalEditorActivityId(prev => prev === entry.id ? null : entry.id)
    setGoalDraft(prev => ({
      ...prev,
      [entry.id]: {
        duration: secondsToDuration(entry.goalSeconds ?? 0),
        period: entry.goalPeriod ?? 'weekly',
        type: entry.goalType ?? 'target',
      },
    }))
  }

  const saveGoal = (activityId: number) => {
    const draft = goalDraft[activityId]
    if (!draft || !isValidDuration(draft.duration)) return

    replaceActivityInCache(activityId, entry => ({
      ...entry,
      goalSeconds: durationToSeconds(draft.duration),
      goalPeriod: draft.period,
      goalType: draft.type,
    }))
    updateGoalMutation.mutate({
      id: activityId,
      goalSeconds: durationToSeconds(draft.duration),
      goalPeriod: draft.period,
      goalType: draft.type,
    })
    setGoalEditorActivityId(null)
  }

  const clearGoal = (activityId: number) => {
    replaceActivityInCache(activityId, entry => ({
      ...entry,
      goalSeconds: undefined,
      goalPeriod: undefined,
      goalType: undefined,
    }))
    updateGoalMutation.mutate({ id: activityId })
    setGoalEditorActivityId(null)
  }

  const openTimeEditor = (entry: ActivityEntry) => {
    setTimeEditorActivityId(prev => prev === entry.id ? null : entry.id)
    setTimeDraft(prev => ({
      ...prev,
      [entry.id]: secondsToDuration(entry.elapsedSeconds ?? durationToSeconds(entry.duration)),
    }))
  }

  const saveLoggedTime = (activityId: number) => {
    const draft = timeDraft[activityId]
    if (!draft || !isValidDuration(draft)) return

    const nextSeconds = durationToSeconds(draft)
    const currentEntry = activities.find(entry => entry.id === activityId)
    if (!currentEntry) return

    const nextEntry = { ...currentEntry, duration: secondsToDuration(nextSeconds), elapsedSeconds: nextSeconds }
    replaceActivityInCache(activityId, () => nextEntry)
    saveLog(nextEntry)
    setTimeEditorActivityId(null)
  }

  const upsertNote = (activityId: number) => {
    const draft = (noteDraft[activityId] ?? '').trim()
    if (!draft) return

    const editingIndex = editingNote[activityId]
    const currentEntry = activities.find(entry => entry.id === activityId)
    if (!currentEntry) return

    const nextNotes = [...currentEntry.notes]
    if (editingIndex === undefined || editingIndex === null) nextNotes.push(draft)
    else nextNotes[editingIndex] = draft

    const nextEntry = { ...currentEntry, notes: nextNotes }
    replaceActivityInCache(activityId, () => nextEntry)
    saveLog(nextEntry)

    setNoteDraft(prev => ({ ...prev, [activityId]: '' }))
    setEditingNote(prev => ({ ...prev, [activityId]: null }))
  }

  const startEditNote = (activityId: number, index: number, value: string) => {
    setEditingNote(prev => ({ ...prev, [activityId]: index }))
    setNoteDraft(prev => ({ ...prev, [activityId]: value }))
  }

  const deleteNote = (activityId: number, index: number) => {
    const currentEntry = activities.find(entry => entry.id === activityId)
    if (!currentEntry) return

    const nextEntry = {
      ...currentEntry,
      notes: currentEntry.notes.filter((_, i) => i !== index),
    }
    replaceActivityInCache(activityId, () => nextEntry)
    saveLog(nextEntry)
  }

  return (
    <Card className="overflow-hidden border-amber-900/30 bg-[linear-gradient(180deg,#f7edcf_0%,#ead8af_100%)] shadow-md dark:border-amber-700/40 dark:bg-[linear-gradient(180deg,#21170f_0%,#130e0a_100%)]">
      <CardHeader className="border-b border-amber-900/20 bg-[linear-gradient(135deg,#5d2f1f_0%,#9f6b2e_60%,#d5a94a_100%)] text-amber-50 dark:border-amber-500/20">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 font-serif text-2xl tracking-wide">
              <Clock3 className="h-5 w-5" /> Activities
            </CardTitle>
            <CardDescription className="text-amber-100/85">
              Timers, goals and field notes for the selected day.
            </CardDescription>
          </div>
          <SlidersHorizontal className="h-6 w-6 text-amber-100" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        <datalist id="activity-duration-presets">
          <option value="00:15" />
          <option value="00:30" />
          <option value="00:45" />
          <option value="01:00" />
          <option value="01:30" />
          <option value="02:00" />
          <option value="03:00" />
          <option value="04:00" />
        </datalist>

        <div className="grid gap-2 rounded-md border border-amber-900/20 bg-amber-50/70 p-3 shadow-inner dark:border-amber-500/20 dark:bg-black/20">
          <label className="text-xs font-medium text-muted-foreground">Date</label>
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>

        <div className="grid gap-2 rounded-md border border-amber-900/20 bg-amber-50/70 p-3 shadow-inner md:grid-cols-[1fr_110px_auto] md:items-end dark:border-amber-500/20 dark:bg-black/20">
          <div className="grid gap-1">
            <label className="text-xs font-medium text-muted-foreground">Activité</label>
            <Input placeholder="Ex: Workout, Meditate..." value={activityName} onChange={(e) => setActivityName(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-medium text-muted-foreground">Durée</label>
            <Input placeholder="00:00" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <Button onClick={addActivity} className="md:mb-[2px]">
            <Plus className="mr-1 h-4 w-4" /> Ajouter
          </Button>
        </div>

        <div className="space-y-3 pr-1">
          {isLoading && (
            <p className="rounded-md border border-dashed border-amber-900/30 bg-amber-50/60 p-4 text-sm text-muted-foreground dark:bg-black/20">
              Chargement des activités...
            </p>
          )}

          {activities.length === 0 && (
            <p className="rounded-md border border-dashed border-amber-900/30 bg-amber-50/60 p-4 text-sm text-muted-foreground dark:bg-black/20">
              Aucune activité pour cette date.
            </p>
          )}

          {activities.map((entry, index) => {
            const accent = activityAccents[index % activityAccents.length]
            const isRunning = runningTimers.some(timer => timer.activityId === entry.id && timer.date === selectedDate)
            const progress = getGoalProgress(entry)
            const circleStyle = {
              background: entry.goalSeconds
                ? `conic-gradient(${accent} ${progress * 3.6}deg, rgba(120, 96, 62, 0.18) 0deg)`
                : `conic-gradient(${accent} 0deg, rgba(120, 96, 62, 0.18) 0deg)`,
            }

            return (
              <div key={entry.id} className="overflow-hidden rounded-md border border-amber-900/20 bg-[#fffaf0] shadow-sm dark:border-amber-500/20 dark:bg-stone-950/80">
                <div className="flex items-center justify-between gap-3 px-4 py-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="h-16 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold leading-tight text-stone-950 dark:text-amber-50">{entry.activity}</p>
                      <p className="truncate text-sm text-stone-500 dark:text-amber-100/65">{getGoalSummary(entry)}</p>
                      <p className="mt-1 font-mono text-sm font-semibold tabular-nums" style={{ color: accent }}>
                        {secondsToStopwatch(entry.elapsedSeconds ?? durationToSeconds(entry.duration))}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-inner"
                    style={circleStyle}
                    title={entry.goalSeconds ? `${progress}%` : 'No goal set'}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fffaf0] text-xs font-semibold text-stone-700 dark:bg-stone-950 dark:text-amber-50">
                      {entry.goalSeconds ? `${progress}%` : ''}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-amber-900/10 bg-stone-100/75 px-4 py-2 dark:border-amber-500/15 dark:bg-black/25">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDetailsActivityId(prev => prev === entry.id ? null : entry.id)}
                      title="Stats and notes"
                      className="h-8 w-8"
                      style={{ color: accent }}
                    >
                      <BarChart3 className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openGoalEditor(entry)}
                      title="Set goal"
                      className="h-8 w-8"
                      style={{ color: accent }}
                    >
                      <TimerReset className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openTimeEditor(entry)}
                      title="Edit logged time"
                      className="h-8 w-8"
                      style={{ color: accent }}
                    >
                      <PencilLine className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteActivity(entry.id)} title="Delete" className="h-8 w-8">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleTimer(entry.id)}
                    title={isRunning ? 'Stop' : 'Play'}
                    className="h-8 w-8"
                    style={{ color: accent }}
                  >
                    {isRunning ? (
                      <Square className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 fill-current" />
                    )}
                  </Button>
                </div>

                {timeEditorActivityId === entry.id && (
                  <div className="grid gap-2 border-t border-amber-900/10 bg-[#f3e4bd] p-3 md:grid-cols-[160px_1fr_auto_auto] md:items-end dark:border-amber-500/15 dark:bg-stone-900/75">
                    <div className="grid gap-1">
                      <label className="text-xs font-medium text-muted-foreground">Temps passé</label>
                      <Input
                        inputMode="numeric"
                        list="activity-duration-presets"
                        pattern="\\d{1,3}:[0-5]\\d"
                        placeholder="01:30"
                        value={timeDraft[entry.id] ?? secondsToDuration(entry.elapsedSeconds ?? durationToSeconds(entry.duration))}
                        onChange={(e) => setTimeDraft(prev => ({ ...prev, [entry.id]: e.target.value }))}
                      />
                    </div>
                    <p className="text-xs text-stone-600 dark:text-amber-100/65">
                      Le timer repartira de cette valeur.
                    </p>
                    <Button size="icon" onClick={() => saveLoggedTime(entry.id)} title="Save logged time">
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => setTimeEditorActivityId(null)} title="Cancel">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {goalEditorActivityId === entry.id && (
                  <div className="grid gap-2 border-t border-amber-900/10 bg-amber-50/80 p-3 md:grid-cols-[110px_1fr_1fr_auto_auto] md:items-end dark:border-amber-500/15 dark:bg-stone-900/70">
                    <div className="grid gap-1">
                      <label className="text-xs font-medium text-muted-foreground">Goal</label>
                      <Input
                        value={goalDraft[entry.id]?.duration ?? '00:00'}
                        onChange={(e) => setGoalDraft(prev => ({
                          ...prev,
                          [entry.id]: { ...(prev[entry.id] ?? { period: 'weekly', type: 'target' }), duration: e.target.value },
                        }))}
                        placeholder="01:00"
                      />
                    </div>
                    <div className="grid gap-1">
                      <label className="text-xs font-medium text-muted-foreground">Period</label>
                      <select
                        value={goalDraft[entry.id]?.period ?? 'weekly'}
                        onChange={(e) => setGoalDraft(prev => ({
                          ...prev,
                          [entry.id]: { ...(prev[entry.id] ?? { duration: '00:00', type: 'target' }), period: e.target.value as 'daily' | 'weekly' },
                        }))}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                    <div className="grid gap-1">
                      <label className="text-xs font-medium text-muted-foreground">Mode</label>
                      <select
                        value={goalDraft[entry.id]?.type ?? 'target'}
                        onChange={(e) => setGoalDraft(prev => ({
                          ...prev,
                          [entry.id]: { ...(prev[entry.id] ?? { duration: '00:00', period: 'weekly' }), type: e.target.value as 'target' | 'limit' },
                        }))}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="target">Target</option>
                        <option value="limit">Limit</option>
                      </select>
                    </div>
                    <Button size="icon" onClick={() => saveGoal(entry.id)} title="Save goal">
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => clearGoal(entry.id)} title="Clear goal">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {detailsActivityId === entry.id && (
                  <div className="space-y-3 border-t border-amber-900/10 bg-amber-50/60 p-3 dark:border-amber-500/15 dark:bg-stone-900/70">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-md border border-amber-900/15 bg-white/70 p-2 dark:bg-black/20">
                        <p className="text-xs text-muted-foreground">Logged</p>
                        <p className="font-mono font-semibold">{secondsToStopwatch(entry.elapsedSeconds ?? durationToSeconds(entry.duration))}</p>
                      </div>
                      <div className="rounded-md border border-amber-900/15 bg-white/70 p-2 dark:bg-black/20">
                        <p className="text-xs text-muted-foreground">Progress</p>
                        <p className="font-mono font-semibold">{entry.goalSeconds ? `${progress}%` : 'No goal'}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {entry.notes.map((note, noteIndex) => (
                        <div key={`${entry.id}-${noteIndex}`} className="flex items-start justify-between gap-2 rounded-md border border-amber-900/15 bg-white/70 p-2 dark:bg-black/20">
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
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
