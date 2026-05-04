import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Clock3, NotebookPen, PencilLine, Play, Plus, Save, SlidersHorizontal, Square, TimerReset, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type ActivityEntry = {
  id: string
  activity: string
  duration: string
  elapsedSeconds?: number
  goalSeconds?: number
  goalPeriod?: 'daily' | 'weekly'
  goalType?: 'target' | 'limit'
  notes: string[]
}

type ActivityByDate = Record<string, ActivityEntry[]>

const STORAGE_KEY = 'activity-tracker-v1'

const activityAccents = ['#6f6ab7', '#d79a4b', '#4ba9bd', '#b85a57', '#7aa66a']

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

export default function ActivityTracker() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [activityName, setActivityName] = useState('')
  const [duration, setDuration] = useState('00:00')
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({})
  const [editingNote, setEditingNote] = useState<Record<string, number | null>>({})
  const [activitiesByDate, setActivitiesByDate] = useState<ActivityByDate>({})
  const [runningTimer, setRunningTimer] = useState<{ date: string, activityId: string } | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [detailsActivityId, setDetailsActivityId] = useState<string | null>(null)
  const [goalEditorActivityId, setGoalEditorActivityId] = useState<string | null>(null)
  const [goalDraft, setGoalDraft] = useState<Record<string, { duration: string, period: 'daily' | 'weekly', type: 'target' | 'limit' }>>({})
  const [timeEditorActivityId, setTimeEditorActivityId] = useState<string | null>(null)
  const [timeDraft, setTimeDraft] = useState<Record<string, string>>({})

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

  const getActivityTotalForGoal = (entry: ActivityEntry) => {
    if (entry.goalPeriod !== 'weekly') return entry.elapsedSeconds ?? durationToSeconds(entry.duration)

    const selectedWeek = getWeekKey(selectedDate)
    return Object.entries(activitiesByDate).reduce((total, [date, entries]) => {
      if (getWeekKey(date) !== selectedWeek) return total

      return total + entries.reduce((entryTotal, candidate) => {
        if (candidate.activity.trim().toLowerCase() !== entry.activity.trim().toLowerCase()) return entryTotal
        return entryTotal + (candidate.elapsedSeconds ?? durationToSeconds(candidate.duration))
      }, 0)
    }, 0)
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

  const saveGoal = (activityId: string) => {
    const draft = goalDraft[activityId]
    if (!draft || !isValidDuration(draft.duration)) return

    updateActivity(activityId, (entry) => ({
      ...entry,
      goalSeconds: durationToSeconds(draft.duration),
      goalPeriod: draft.period,
      goalType: draft.type,
    }))
    setGoalEditorActivityId(null)
  }

  const clearGoal = (activityId: string) => {
    updateActivity(activityId, (entry) => ({
      ...entry,
      goalSeconds: undefined,
      goalPeriod: undefined,
      goalType: undefined,
    }))
    setGoalEditorActivityId(null)
  }

  const openTimeEditor = (entry: ActivityEntry) => {
    setTimeEditorActivityId(prev => prev === entry.id ? null : entry.id)
    setTimeDraft(prev => ({
      ...prev,
      [entry.id]: secondsToDuration(entry.elapsedSeconds ?? durationToSeconds(entry.duration)),
    }))
  }

  const saveLoggedTime = (activityId: string) => {
    const draft = timeDraft[activityId]
    if (!draft || !isValidDuration(draft)) return

    const nextSeconds = durationToSeconds(draft)
    updateActivity(activityId, (entry) => ({
      ...entry,
      duration: secondsToDuration(nextSeconds),
      elapsedSeconds: nextSeconds,
    }))
    setTimeEditorActivityId(null)
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
          {activities.length === 0 && (
            <p className="rounded-md border border-dashed border-amber-900/30 bg-amber-50/60 p-4 text-sm text-muted-foreground dark:bg-black/20">
              Aucune activité pour cette date.
            </p>
          )}

          {activities.map((entry, index) => {
            const accent = activityAccents[index % activityAccents.length]
            const isRunning = runningTimer?.activityId === entry.id && runningTimer.date === selectedDate
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
