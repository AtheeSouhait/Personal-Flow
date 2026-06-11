import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { recordCompletionToday } from '@/lib/streak'

interface CelebrationContextValue {
  celebrate: (message?: string) => void
}

const CelebrationContext = createContext<CelebrationContextValue>({ celebrate: () => {} })

export const useCelebration = () => useContext(CelebrationContext)

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4', '#eab308']
const PIECE_COUNT = 60

interface Piece {
  left: number
  delay: number
  duration: number
  color: string
  size: number
  rotation: number
}

function makePieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    duration: 1.6 + Math.random() * 1.2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 6,
    rotation: Math.random() * 360,
  }))
}

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [pieces, setPieces] = useState<Piece[] | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const timeoutRef = useRef<number | null>(null)

  const celebrate = useCallback((msg?: string) => {
    recordCompletionToday()
    setPieces(makePieces())
    setMessage(msg ?? null)
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => {
      setPieces(null)
      setMessage(null)
    }, 3000)
  }, [])

  return (
    <CelebrationContext.Provider value={{ celebrate }}>
      {children}
      {pieces && (
        <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden>
          <style>{`
            @keyframes pf-confetti-fall {
              0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
              100% { transform: translateY(110vh) rotate(720deg); opacity: 0.6; }
            }
          `}</style>
          {pieces.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: 0,
                left: `${p.left}%`,
                width: p.size,
                height: p.size * 0.6,
                backgroundColor: p.color,
                transform: `rotate(${p.rotation}deg)`,
                animation: `pf-confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
                borderRadius: 2,
              }}
            />
          ))}
          {message && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-green-600 text-white text-sm font-semibold shadow-lg animate-in fade-in slide-in-from-top-4">
              {message}
            </div>
          )}
        </div>
      )}
    </CelebrationContext.Provider>
  )
}
