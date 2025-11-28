import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Clock } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { Input } from './input'

interface PomodoroTimerProps {
  defaultMinutes?: number
  onComplete?: () => void
  className?: string
}

export function PomodoroTimer({
  defaultMinutes = 25,
  onComplete,
  className
}: PomodoroTimerProps) {
  const [duration, setDuration] = useState(defaultMinutes) // in minutes
  const [timeLeft, setTimeLeft] = useState(defaultMinutes * 60) // in seconds
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isEditingTime, setIsEditingTime] = useState(false)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            setIsCompleted(true)
            playCompletionSound()
            onComplete?.()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft, onComplete])

  const playCompletionSound = async () => {
    try {
      // Try to call the TTS service
      const response = await fetch('http://localhost:8080/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: "Good job, it's time to take a 5 minutes break!",
          voiceStyle: 'F2',
        }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })

      if (response.ok) {
        // Get the audio blob from the response
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)

        // Play the TTS audio
        await audio.play()

        // Clean up the object URL after playing
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
        }
      } else {
        // If TTS service fails, fall back to simple beep
        playFallbackBeep()
      }
    } catch (error) {
      // Silently handle errors (service not available, timeout, etc.)
      // Fall back to simple beep sound
      playFallbackBeep()
    }
  }

  const playFallbackBeep = () => {
    // Create a simple beep sound using Web Audio API as fallback
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      // Silently ignore if audio playback fails
    }
  }

  const toggleTimer = () => {
    if (isCompleted) {
      handleReset()
    }
    setIsRunning(!isRunning)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(duration * 60)
    setIsCompleted(false)
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
    }
  }

  const handleDurationChange = (newMinutes: number) => {
    if (newMinutes > 0 && newMinutes <= 999) {
      setDuration(newMinutes)
      if (!isRunning) {
        setTimeLeft(newMinutes * 60)
        setIsCompleted(false)
      }
    }
  }

  const handleTimeClick = () => {
    if (!isRunning) {
      setIsEditingTime(true)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isEditingTime ? (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Input
            type="number"
            min="1"
            max="999"
            value={duration}
            onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1)}
            onBlur={() => setIsEditingTime(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setIsEditingTime(false)
              }
            }}
            className="w-16 h-8 text-sm"
            autoFocus
          />
          <span className="text-xs text-muted-foreground">min</span>
        </div>
      ) : (
        <>
          <div className="relative">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              {/* Background circle */}
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-muted/20"
              />
              {/* Progress circle */}
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                strokeLinecap="round"
                className={cn(
                  'transition-all duration-300',
                  isCompleted ? 'text-green-500' : 'text-primary'
                )}
              />
            </svg>
            <button
              onClick={handleTimeClick}
              disabled={isRunning}
              className={cn(
                'absolute inset-0 flex items-center justify-center',
                !isRunning && 'cursor-pointer hover:opacity-70 transition-opacity'
              )}
              title={!isRunning ? 'Click to edit duration' : undefined}
            >
              <span className={cn(
                'text-xs font-mono font-semibold',
                isCompleted && 'text-green-500'
              )}>
                {formatTime(timeLeft)}
              </span>
            </button>
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTimer}
              className={cn(
                'h-8 w-8',
                isCompleted && 'text-green-500 hover:text-green-600'
              )}
              title={isRunning ? 'Pause' : 'Play'}
            >
              {isRunning ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="h-8 w-8"
              title="Reset"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
