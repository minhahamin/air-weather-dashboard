import { useCallback, useState } from 'react'
import { CompareView } from './components/CompareView'
import { CitySearch } from './components/CitySearch'
import { DataTable } from './components/DataTable'
import { DailyForecast, HourlyCharts } from './components/ForecastCharts'
import { Logo, MoonIcon, SunIcon } from './components/Icons'
import { SummaryCard, SummarySkeleton } from './components/SummaryCard'
import { ErrorState, Skeleton } from './components/ui'
import { useCityData } from './hooks/queries'
import { useSettings } from './hooks/settings'
import { useLocalStorage } from './hooks/useLocalStorage'
import { DEFAULT_CITY, pushRecent } from './lib/cities'
import type { City } from './lib/types'

type Tab = 'overview' | 'compare' | 'table'
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: '개요' },
  { id: 'compare', label: '도시 비교' },
  { id: 'table', label: '데이터 표' },
]

function ChartsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="차트를 불러오는 중">
      <Skeleton className="h-[34rem] w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  )
}

export default function App() {
  const { unit, setUnit, theme, toggleTheme } = useSettings()
  const [city, setCity] = useLocalStorage<City>('awd:city', DEFAULT_CITY)
  const [recent, setRecent] = useLocalStorage<City[]>('awd:recent', [])
  const [tab, setTab] = useState<Tab>('overview')
  const query = useCityData(city)

  const remember = useCallback((c: City) => setRecent((r) => pushRecent(r, c)), [setRecent])
  const select = (c: City) => {
    setCity(c)
    remember(c)
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 pb-16 sm:px-6">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3 py-5">
        <div className="flex items-center gap-2.5">
          <Logo />
          <div className="leading-tight">
            <div className="text-base font-semibold text-ink">Air &amp; Weather</div>
            <div className="text-[11px] text-muted">날씨 · 대기질 대시보드</div>
          </div>
        </div>
        <div className="order-3 w-full sm:order-none sm:w-80 sm:flex-1 sm:max-w-md">
          <CitySearch recent={recent} onSelect={select} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div role="group" aria-label="온도 단위" className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5">
            {(['metric', 'imperial'] as const).map((u) => (
              <button
                key={u}
                type="button"
                aria-pressed={unit === u}
                onClick={() => setUnit(u)}
                className={`rounded-md px-2.5 py-1 font-mono text-xs font-semibold ${unit === u ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink'}`}
              >
                {u === 'metric' ? '°C' : '°F'}
              </button>
            ))}
          </div>
          <button type="button" onClick={toggleTheme} className="icon-btn h-9 w-9 border border-line" aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      <nav aria-label="보기 전환" className="mb-5 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'compare' ? (
          <CompareView unit={unit} recent={recent} onRecent={remember} />
        ) : query.isLoading ? (
          tab === 'overview' ? (
            <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
              <SummarySkeleton />
              <ChartsSkeleton />
            </div>
          ) : (
            <Skeleton className="h-[40rem] w-full" />
          )
        ) : query.isError || !query.data ? (
          <ErrorState message={query.error instanceof Error ? query.error.message : '데이터를 불러오지 못했습니다.'} onRetry={() => query.refetch()} />
        ) : tab === 'overview' ? (
          <div className="grid items-start gap-4 lg:grid-cols-[22rem_1fr]">
            <div className="lg:sticky lg:top-4">
              <SummaryCard city={city} data={query.data} unit={unit} />
            </div>
            <div className="space-y-4">
              <HourlyCharts data={query.data} unit={unit} />
              <DailyForecast data={query.data} unit={unit} />
            </div>
          </div>
        ) : (
          <DataTable data={query.data} unit={unit} />
        )}
      </main>

      <footer className="mt-10 border-t border-line pt-4 text-xs text-muted">
        데이터 출처:{' '}
        <a className="underline hover:text-ink" href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Open-Meteo.com
        </a>{' '}
        (
        <a className="underline hover:text-ink" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
          CC BY 4.0
        </a>
        ). AQI는 US AQI 기준이며 한국 환경부 등급과 다를 수 있습니다.
      </footer>
    </div>
  )
}
