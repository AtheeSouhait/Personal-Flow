import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

const STORAGE_KEY = 'pinnedTodoIds'

function load(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set()
  } catch {
    return new Set()
  }
}

interface PinnedTodosContextType {
  pinnedIds: Set<number>
  toggle: (id: number) => void
  isPinned: (id: number) => boolean
}

const PinnedTodosContext = createContext<PinnedTodosContextType | null>(null)

export function PinnedTodosProvider({ children }: { children: ReactNode }) {
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(load)

  const toggle = useCallback((id: number) => {
    setPinnedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      return next
    })
  }, [])

  const isPinned = useCallback((id: number) => pinnedIds.has(id), [pinnedIds])

  return (
    <PinnedTodosContext.Provider value={{ pinnedIds, toggle, isPinned }}>
      {children}
    </PinnedTodosContext.Provider>
  )
}

export function usePinnedTodos() {
  const ctx = useContext(PinnedTodosContext)
  if (!ctx) throw new Error('usePinnedTodos must be used within PinnedTodosProvider')
  return ctx
}
