import { useMemo, useState } from 'react'
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useCitiesData } from '../hooks/queries'
import { useSettings } from '../hooks/settings'
import { cityLabel } from '../lib/api'
import { DEFAULT_COMPARE, MAX_COMPARE, MIN_COMPARE } from '../lib/cities'
import { SERIES_DASH, SERIES_MARKER } from '../lib/palette'
import { sliceFromNow } from '../lib/transform'
import { convertTemp, formatTemp, unitSymbol } from '../lib/units'
import type { City, HourlyPoint, Unit } from '../lib/types'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { ChartTooltip, SeriesLegend, makeDot } from './chartParts'
import { CitySearch } from './CitySearch'
import { CloseIcon } from './Icons'
import { AqiBadge, EmptyState, ErrorState, Panel, Segmented, Skeleton } from './ui'

type Metric = 'temp' | 'precipProb' | 'pm25' | 'aqi'

const METRICS: { value: Metric; label: string }[] = [
  { value: 'temp', label: '기온' },
  { value: 'precipProb', label: '강수확률' },
  { value: 'pm25', label: 'PM2.5' },
  { value: 'aqi', label: 'AQI' },
]

const HOURS = 48

function pick(p: HourlyPoint, m: Metric, unit: Unit): number | null {
  if (m === 'temp') return convertTemp(p.temp, unit)
  return p[m]
}

function formatMetric(v: number | null, m: Metric, unit: Unit): string {
  if (v == null) return '-'
  switch (m) {
    case 'temp':
      return `${v.toFixed(1)}${unitSymbol(unit)}`
    case 'precipProb':
      return `${v.toFixed(0)}%`
    case 'pm25':
      return `${v.toFixed(1)} ug/m3`
    default:
      return `${Math.round(v)}`
  }
}

export function CompareView({ unit, recent, onRecent }: { unit: Unit; recent: City[]; onRecent: (c: City) => void }) {
  const [cities, setCities] = useLocalStorage<City[]>('awd:compare', DEFAULT_COMPARE)
  const [metric, setMetric] = useState<Metric>('temp')
  const { palette } = useSettings()
  const queries = useCitiesData(cities)

  const add = (c: City) => {
    onRecent(c)
    setCities((prev) => (prev.some((x) => x.id === c.id) || prev.length >= MAX_COMPARE ? prev : [...prev, c]))
  }
  const remove = (id: string) => setCities((prev) => (prev.length <= MIN_COMPARE ? prev : prev.filter((c) => c.id !== id)))

  const chartRows = useMemo(() => {
    const slices = queries.map((q) => (q.data ? sliceFromNow(q.data.hourly, q.data.current.time, HOURS) : []))
    return Array.from({ length: HOURS }, (_, i) => {
      const row: Record<string, number | string | null> = { offset: i, title: i === 0 ? '현재 시각' : `현재 +${i}시간` }
      slices.forEach((s, ci) => {
        const p = s[i]
        row[`v${ci}`] = p ? pick(p, metric, unit) : null
        row[`t${ci}`] = p ? p.time.replace('T', ' ') : ''
      })
      return row
    })
  }, [queries, metric, unit])

  const allLoading = queries.every((q) => q.isLoading)
  const allFailed = queries.length > 0 && queries.every((q) => q.isError)
  const tick = { fill: palette.axis, fontSize: 11 }
  const items = cities.map((c, i) => ({
    label: cityLabel(c),
    color: palette.series[i] ?? palette.series[0],
    dash: SERIES_DASH[i] ?? '0',
    shape: SERIES_MARKER[i] ?? 'circle',
  }))
  const metricLabel = METRICS.find((m) => m.value === metric)?.label ?? ''

  return (
    <div className="space-y-4">
      <Panel
        title={`도시 비교 (${cities.length}/${MAX_COMPARE})`}
        aside={<Segmented label="비교 지표" value={metric} options={METRICS} onChange={setMetric} />}
      >
        <div className="grid gap-4 md:grid-cols-[1fr_18rem]">
          <ul className="flex flex-wrap gap-2" aria-label="비교 중인 도시">
            {cities.map((c, i) => {
              const q = queries[i]
              const d = q?.data
              return (
                <li key={c.id} className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 py-1.5 pl-2.5 pr-1.5 text-sm">
                  <svg width="22" height="10" aria-hidden="true">
                    <line x1="0" x2="22" y1="5" y2="5" stroke={items[i]?.color} strokeWidth="2.5" strokeDasharray={items[i]?.dash} />
                  </svg>
                  <span className="font-medium text-ink">{cityLabel(c)}</span>
                  {q?.isLoading && <Skeleton className="h-4 w-10" />}
                  {q?.isError && <span className="text-xs text-[#d94a4a]">오류</span>}
                  {d && (
                    <>
                      <span className="font-mono text-xs tabular-nums text-muted">{formatTemp(d.current.temp, unit)}</span>
                      <AqiBadge aqi={d.current.aqi} size="sm" />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    disabled={cities.length <= MIN_COMPARE}
                    aria-label={`${cityLabel(c)} 비교에서 제거`}
                    className="icon-btn h-6 w-6 disabled:opacity-30"
                  >
                    <CloseIcon width={14} height={14} />
                  </button>
                </li>
              )
            })}
          </ul>
          <div>
            {cities.length < MAX_COMPARE ? (
              <CitySearch recent={recent} onSelect={add} label="비교할 도시 추가" placeholder="비교할 도시 추가" />
            ) : (
              <p className="text-xs text-muted">최대 {MAX_COMPARE}개까지 비교할 수 있습니다. 하나를 제거하면 추가할 수 있습니다.</p>
            )}
          </div>
        </div>
      </Panel>

      <Panel title={`${metricLabel} 비교 - 현재부터 ${HOURS}시간`}>
        {allLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : allFailed ? (
          <ErrorState message="선택한 도시의 데이터를 불러오지 못했습니다." onRetry={() => queries.forEach((q) => q.refetch())} />
        ) : cities.length < MIN_COMPARE ? (
          <EmptyState title="비교할 도시를 2개 이상 선택해 주세요." />
        ) : (
          <>
            <SeriesLegend items={items} />
            <div className="h-72 w-full" role="img" aria-label={`${cities.map(cityLabel).join(', ')}의 ${metricLabel} 비교 차트`}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartRows} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
                  <CartesianGrid stroke={palette.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="offset" tick={tick} tickFormatter={(v: number) => (v % 6 === 0 ? `+${v}h` : '')} interval={0} tickLine={false} axisLine={{ stroke: palette.grid }} />
                  <YAxis tick={tick} tickLine={false} axisLine={false} domain={metric === 'precipProb' ? [0, 100] : [0, 'auto']} />
                  <Tooltip
                    cursor={{ stroke: palette.axis, strokeDasharray: '3 3' }}
                    content={
                      <ChartTooltip
                        build={(p: Record<string, number | string | null>) => ({
                          title: String(p.title),
                          rows: cities.map((c, i) => ({
                            label: cityLabel(c),
                            value: formatMetric(p[`v${i}`] as number | null, metric, unit),
                            color: items[i]?.color,
                          })),
                          footer: (
                            <div className="mt-1.5 border-t pt-1 text-[10px] opacity-70" style={{ borderColor: palette.tooltipBorder }}>
                              현지 시각 기준: {cities.map((c, i) => `${cityLabel(c)} ${String(p[`t${i}`] ?? '').slice(5, 16)}`).join(' / ')}
                            </div>
                          ),
                        })}
                      />
                    }
                  />
                  {cities.map((c, i) => (
                    <Line
                      key={c.id}
                      dataKey={`v${i}`}
                      name={cityLabel(c)}
                      stroke={items[i]?.color}
                      strokeWidth={2.2}
                      strokeDasharray={items[i]?.dash}
                      dot={makeDot(items[i]?.shape ?? 'circle', items[i]?.color ?? '#000', 8)}
                      activeDot={{ r: 5 }}
                      connectNulls
                      isAnimationActive={false}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              각 도시의 현지 시각을 기준으로 현재 시각부터 정렬했습니다. 선 모양과 마커 모양으로도 도시를 구분할 수 있습니다.
              {metric === 'pm25' && ' 대기질 데이터가 없는 지역은 선이 표시되지 않습니다.'}
              {metric === 'aqi' && ' US AQI: 50 이하 좋음, 100 이하 보통.'}
            </p>
          </>
        )}
      </Panel>
    </div>
  )
}
