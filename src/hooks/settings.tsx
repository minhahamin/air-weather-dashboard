import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { DARK, LIGHT, type ChartPalette } from '../lib/palette'
import type { Unit } from '../lib/types'
import { useLocalStorage } from './useLocalStorage'

type Theme = 'light' | 'dark'

interface Settings {
  unit: Unit
  setUnit: (u: Unit) => void
  theme: Theme
  toggleTheme: () => void
  palette: ChartPalette
}

const Ctx = createContext<Settings | null>(null)

function initialTheme(): Theme {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [unit, setUnit] = useLocalStorage<Unit>('awd:unit', 'metric')
  const [theme, setTheme] = useLocalStorage<Theme>('awd:theme', initialTheme())

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const value = useMemo<Settings>(
    () => ({
      unit,
      setUnit,
      theme,
      toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
      palette: theme === 'dark' ? DARK : LIGHT,
    }),
    [unit, setUnit, theme, setTheme],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSettings(): Settings {
  const v = useContext(Ctx)
  if (!v) throw new Error('SettingsProvider가 필요합니다.')
  return v
}
