import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { getAqiGrade } from '../lib/aqi'
import { filterRows, repeatRows, sortRows, type SortDir, type SortKey } from '../lib/tableLogic'
import { formatHourLabel } from '../lib/transform'
import { formatNumber, formatTemp, unitSymbol } from '../lib/units'
import type { CityData, HourlyPoint, Unit } from '../lib/types'
import { useDebounced } from '../hooks/useDebounced'
import { ArrowIcon, SearchIcon } from './Icons'
import { AqiBadge, EmptyState, Panel, Segmented } from './ui'

const ROW_HEIGHT = 36
const VIEWPORT_HEIGHT = 480
const GRID = 'minmax(8.5rem,1.4fr) repeat(5,minmax(5rem,1fr)) minmax(9rem,1.5fr)'
const MIN_WIDTH = 760

const MULTIPLIERS = [
  { value: 1, label: 'x1' },
  { value: 10, label: 'x10' },
  { value: 30, label: 'x30' },
]
const MODES: { value: 'virtual' | 'full'; label: string }[] = [
  { value: 'virtual', label: '가상화' },
  { value: 'full', label: '전체 렌더' },
]

interface Column {
  key: SortKey
  label: (unit: Unit) => string
  align?: 'right'
}

const COLUMNS: Column[] = [
  { key: 'time', label: () => '시각' },
  { key: 'temp', label: (u) => `기온 ${unitSymbol(u)}`, align: 'right' },
  { key: 'precip', label: () => '강수 mm', align: 'right' },
  { key: 'precipProb', label: () => '강수확률', align: 'right' },
  { key: 'pm25', label: () => 'PM2.5', align: 'right' },
  { key: 'pm10', label: () => 'PM10', align: 'right' },
  { key: 'aqi', label: () => 'US AQI' },
]

const Row = memo(function Row({ row, index, unit, style }: { row: HourlyPoint; index: number; unit: Unit; style?: React.CSSProperties }) {
  const g = getAqiGrade(row.aqi)
  return (
    <div
      role="row"
      aria-rowindex={index + 2}
      data-row
      className="grid items-center border-b border-line px-3 text-sm tabular-nums odd:bg-surface even:bg-surface-2/40"
      style={{ gridTemplateColumns: GRID, height: ROW_HEIGHT, minWidth: MIN_WIDTH, ...style }}
    >
      <div role="cell" className="font-mono text-xs text-ink">{formatHourLabel(row.time)}</div>
      <div role="cell" className="text-right font-mono">{formatTemp(row.temp, unit, 1)}</div>
      <div role="cell" className="text-right font-mono">{formatNumber(row.precip, 1)}</div>
      <div role="cell" className="text-right font-mono">{formatNumber(row.precipProb, 0, '%')}</div>
      <div role="cell" className="text-right font-mono">{formatNumber(row.pm25, 1)}</div>
      <div role="cell" className="text-right font-mono">{formatNumber(row.pm10, 1)}</div>
      <div role="cell" className="pl-4" title={g?.label}>
        <AqiBadge aqi={row.aqi} size="sm" />
      </div>
    </div>
  )
})

export function DataTable({ data, unit }: { data: CityData; unit: Unit }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'time', dir: 'asc' })
  const [mode, setMode] = useState<'virtual' | 'full'>('virtual')
  const [mult, setMult] = useState(1)
  const [bench, setBench] = useState<{ ms: number; dom: number; label: string } | null>(null)
  const debounced = useDebounced(query, 200)
  const scrollRef = useRef<HTMLDivElement>(null)
  const t0 = useRef<number | null>(null)

  const base = data.hourly
  const rows = useMemo(
    () => sortRows(filterRows(repeatRows(base, mult), debounced), sort.key, sort.dir),
    [base, mult, debounced, sort],
  )

  const virtual = mode === 'virtual'
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
    initialRect: { width: 900, height: VIEWPORT_HEIGHT },
  })

  // 모드/배수가 바뀐 뒤 "클릭 -> 커밋 -> 페인트"까지의 시간을 측정한다.
  useEffect(() => {
    if (t0.current == null) return
    const start = t0.current
    t0.current = null
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const dom = scrollRef.current?.querySelectorAll('[data-row]').length ?? 0
        setBench({ ms: performance.now() - start, dom, label: `${virtual ? '가상화' : '전체 렌더'} / ${base.length * mult}행` })
      }),
    )
    return () => cancelAnimationFrame(id)
  }, [mode, mult, virtual, base.length])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [debounced, sort, mode, mult])

  const markStart = () => {
    t0.current = performance.now()
  }

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'time' ? 'asc' : 'desc' }))

  const items = virtualizer.getVirtualItems()

  return (
    <Panel
      title="시간별 데이터 표"
      aside={
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="렌더 방식" value={mode} options={MODES} onChange={(v) => { markStart(); setMode(v) }} />
          <Segmented label="데이터 배수" value={mult} options={MULTIPLIERS} onChange={(v) => { markStart(); setMult(v) }} />
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" width={16} height={16} />
          <input
            type="search"
            aria-label="표 검색"
            placeholder="시각 또는 등급 검색 (예: 11/28, 나쁨, 80)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="field w-full pl-9"
          />
        </div>
        <p className="text-xs text-muted" aria-live="polite">
          <span data-testid="row-count">{rows.length.toLocaleString()}</span> / {(base.length * mult).toLocaleString()}행
        </p>
      </div>

      <div
        ref={scrollRef}
        tabIndex={0}
        role="region"
        aria-label="시간별 데이터 표 (스크롤 가능)"
        className="relative overflow-auto rounded-lg border border-line"
        style={{ height: VIEWPORT_HEIGHT }}
      >
        <div role="table" aria-label="시간별 날씨 및 대기질" aria-rowcount={rows.length + 1} style={{ minWidth: MIN_WIDTH }}>
          <div role="rowgroup" className="sticky top-0 z-10">
            <div
              role="row"
              aria-rowindex={1}
              className="grid items-center border-b border-line bg-surface-2 px-3 text-xs font-semibold text-muted"
              style={{ gridTemplateColumns: GRID, height: 38, minWidth: MIN_WIDTH }}
            >
              {COLUMNS.map((c) => {
                const active = sort.key === c.key
                return (
                  <div key={c.key} role="columnheader" aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} className={c.align === 'right' ? 'text-right' : c.key === 'aqi' ? 'pl-4' : ''}>
                    <button type="button" onClick={() => toggleSort(c.key)} className={`inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-ink ${active ? 'text-ink' : ''}`}>
                      {c.label(unit)}
                      <ArrowIcon width={12} height={12} className={`transition-transform ${active ? (sort.dir === 'asc' ? 'rotate-180' : '') : 'opacity-0'}`} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div role="rowgroup">
            {rows.length === 0 ? (
              <EmptyState title="조건에 맞는 행이 없습니다." hint="검색어를 지우거나 다른 값을 입력해 보세요." />
            ) : virtual ? (
              <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
                {items.map((vi) => {
                  const row = rows[vi.index]
                  if (!row) return null
                  return <Row key={vi.key} row={row} index={vi.index} unit={unit} style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${vi.start}px)` }} />
                })}
              </div>
            ) : (
              rows.map((row, i) => <Row key={i} row={row} index={i} unit={unit} />)
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted" aria-live="polite">
        <span className="font-semibold text-ink">렌더 측정</span>
        {bench ? (
          <>
            <span>{bench.label}</span>
            <span>
              소요 <b className="font-mono text-ink" data-testid="bench-ms">{bench.ms.toFixed(0)}</b> ms
            </span>
            <span>
              DOM 행 <b className="font-mono text-ink" data-testid="bench-dom">{bench.dom.toLocaleString()}</b>개
            </span>
          </>
        ) : (
          <span>렌더 방식이나 데이터 배수를 바꾸면 클릭부터 화면 반영(2 프레임 후)까지의 시간을 측정합니다.</span>
        )}
      </div>
    </Panel>
  )
}
