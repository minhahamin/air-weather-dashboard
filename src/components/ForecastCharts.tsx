import { useId, useMemo, useState } from 'react'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useSettings } from '../hooks/settings'
import { getAqiGrade } from '../lib/aqi'
import { SERIES_DASH } from '../lib/palette'
import { formatDayLabel, formatHourLabel, sliceFromNow } from '../lib/transform'
import { convertTemp, formatNumber, formatTemp, unitSymbol } from '../lib/units'
import { describeWeather } from '../lib/weatherCode'
import type { CityData, Unit } from '../lib/types'
import { ChartTooltip, HatchDefs, SeriesLegend, makeDot } from './chartParts'
import { AqiBadge, EmptyState, Panel, Segmented } from './ui'
import { WeatherIcon } from './Icons'

const RANGES = [
  { value: 24, label: '24시간' },
  { value: 48, label: '48시간' },
  { value: 72, label: '72시간' },
]

export function HourlyCharts({ data, unit }: { data: CityData; unit: Unit }) {
  const [range, setRange] = useState(48)
  const { palette } = useSettings()
  const hatchId = useId().replace(/:/g, '')

  const rows = useMemo(
    () =>
      sliceFromNow(data.hourly, data.current.time, range).map((p) => ({
        ...p,
        label: formatHourLabel(p.time),
        hour: p.time.slice(11, 13),
        tempView: convertTemp(p.temp, unit),
      })),
    [data, range, unit],
  )

  const every = Math.max(1, Math.round(range / 8))
  const hasAir = data.airAvailable && rows.some((r) => r.pm25 != null)
  const temps = rows.map((r) => r.temp).filter((v): v is number => v != null)
  const summary = temps.length
    ? `향후 ${range}시간 기온 범위 ${formatTemp(Math.min(...temps), unit)}에서 ${formatTemp(Math.max(...temps), unit)}`
    : '기온 데이터 없음'

  const tick = { fill: palette.axis, fontSize: 11 }
  const tickFormatter = (_: unknown, i: number) => (i % every === 0 ? `${rows[i]?.hour ?? ''}시` : '')

  return (
    <Panel title="시간별 예보" aside={<Segmented label="표시 범위" value={range} options={RANGES} onChange={setRange} />}>
      {rows.length === 0 ? (
        <EmptyState title="표시할 시간별 데이터가 없습니다." />
      ) : (
        <div className="space-y-6">
          <figure aria-label={`기온과 강수량 차트. ${summary}`}>
            <figcaption className="mb-2 text-xs font-medium text-muted">기온과 강수량</figcaption>
            <SeriesLegend
              items={[
                { label: `기온 (${unitSymbol(unit)})`, color: palette.temp, dash: SERIES_DASH[0], shape: 'circle' },
                { label: '강수량 (mm)', color: palette.precip, dash: '0', shape: 'bar' },
              ]}
            />
            <div className="h-60 w-full" role="img" aria-label={summary}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
                  <HatchDefs id={hatchId} color={palette.precip} />
                  <CartesianGrid stroke={palette.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={tick} tickFormatter={tickFormatter} interval={0} tickLine={false} axisLine={{ stroke: palette.grid }} />
                  <YAxis yAxisId="t" tick={tick} tickLine={false} axisLine={false} unit="°" domain={['auto', 'auto']} />
                  <YAxis yAxisId="p" orientation="right" tick={tick} tickLine={false} axisLine={false} domain={[0, (max: number) => Math.max(2, Math.ceil(max))]} width={32} />
                  <Tooltip
                    cursor={{ stroke: palette.axis, strokeDasharray: '3 3' }}
                    content={
                      <ChartTooltip
                        build={(p: (typeof rows)[number]) => ({
                          title: p.label,
                          rows: [
                            { label: '기온', value: formatTemp(p.temp, unit, 1), color: palette.temp },
                            { label: '강수량', value: formatNumber(p.precip, 1, ' mm'), color: palette.precip },
                            { label: '강수확률', value: formatNumber(p.precipProb, 0, '%') },
                          ],
                        })}
                      />
                    }
                  />
                  <Bar yAxisId="p" dataKey="precip" fill={`url(#${hatchId})`} stroke={palette.precip} strokeWidth={1} isAnimationActive={false} />
                  <Line yAxisId="t" dataKey="tempView" stroke={palette.temp} strokeWidth={2.2} dot={makeDot('circle', palette.temp, every)} activeDot={{ r: 5 }} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </figure>

          <figure aria-label="초미세먼지와 미세먼지 차트">
            <figcaption className="mb-2 text-xs font-medium text-muted">미세먼지 (ug/m3)</figcaption>
            {!hasAir ? (
              <EmptyState title="이 지역의 대기질 데이터가 없습니다." hint="날씨 정보만 제공됩니다." />
            ) : (
              <>
                <SeriesLegend
                  items={[
                    { label: 'PM2.5', color: palette.pm25, dash: SERIES_DASH[0], shape: 'circle' },
                    { label: 'PM10', color: palette.pm10, dash: SERIES_DASH[1], shape: 'square' },
                  ]}
                />
                <div className="h-52 w-full" role="img" aria-label="향후 미세먼지 농도 추이">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
                      <CartesianGrid stroke={palette.grid} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={tick} tickFormatter={tickFormatter} interval={0} tickLine={false} axisLine={{ stroke: palette.grid }} />
                      <YAxis tick={tick} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                      <Tooltip
                        cursor={{ stroke: palette.axis, strokeDasharray: '3 3' }}
                        content={
                          <ChartTooltip
                            build={(p: (typeof rows)[number]) => ({
                              title: p.label,
                              rows: [
                                { label: 'PM2.5', value: formatNumber(p.pm25, 1), color: palette.pm25 },
                                { label: 'PM10', value: formatNumber(p.pm10, 1), color: palette.pm10 },
                                { label: 'US AQI', value: p.aqi == null ? '-' : `${Math.round(p.aqi)} (${getAqiGrade(p.aqi)?.label ?? '-'})` },
                              ],
                            })}
                          />
                        }
                      />
                      <Line dataKey="pm25" stroke={palette.pm25} strokeWidth={2.2} strokeDasharray={SERIES_DASH[0]} dot={makeDot('circle', palette.pm25, every)} activeDot={{ r: 5 }} isAnimationActive={false} connectNulls />
                      <Line dataKey="pm10" stroke={palette.pm10} strokeWidth={2} strokeDasharray={SERIES_DASH[1]} dot={makeDot('square', palette.pm10, every)} activeDot={{ r: 5 }} isAnimationActive={false} connectNulls />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </figure>
        </div>
      )}
    </Panel>
  )
}

export function DailyForecast({ data, unit }: { data: CityData; unit: Unit }) {
  const { palette } = useSettings()
  const today = data.current.time.slice(0, 10)
  const days = useMemo(() => data.daily.filter((d) => d.date >= today), [data.daily, today])
  const rows = useMemo(
    () => days.map((d) => ({ ...d, label: formatDayLabel(d.date), maxView: convertTemp(d.tMax, unit), minView: convertTemp(d.tMin, unit) })),
    [days, unit],
  )
  const tick = { fill: palette.axis, fontSize: 11 }

  return (
    <Panel title="일별 예보">
      {rows.length === 0 ? (
        <EmptyState title="일별 예보 데이터가 없습니다." />
      ) : (
        <>
          <SeriesLegend
            items={[
              { label: `최고 (${unitSymbol(unit)})`, color: palette.temp, dash: SERIES_DASH[0], shape: 'triangle' },
              { label: '최저', color: palette.precip, dash: SERIES_DASH[1], shape: 'diamond' },
            ]}
          />
          <div className="h-48 w-full" role="img" aria-label="일별 최고·최저 기온 추이">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid stroke={palette.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={{ stroke: palette.grid }} />
                <YAxis tick={tick} tickLine={false} axisLine={false} unit="°" domain={['auto', 'auto']} />
                <Tooltip
                  cursor={{ stroke: palette.axis, strokeDasharray: '3 3' }}
                  content={
                    <ChartTooltip
                      build={(p: (typeof rows)[number]) => ({
                        title: p.label,
                        rows: [
                          { label: '최고', value: formatTemp(p.tMax, unit, 1), color: palette.temp },
                          { label: '최저', value: formatTemp(p.tMin, unit, 1), color: palette.precip },
                          { label: '강수량 합', value: formatNumber(p.precipSum, 1, ' mm') },
                          { label: '날씨', value: describeWeather(p.weatherCode).label },
                        ],
                      })}
                    />
                  }
                />
                <Line dataKey="maxView" stroke={palette.temp} strokeWidth={2.2} dot={makeDot('triangle', palette.temp, 1)} activeDot={{ r: 5 }} isAnimationActive={false} />
                <Line dataKey="minView" stroke={palette.precip} strokeWidth={2.2} strokeDasharray={SERIES_DASH[1]} dot={makeDot('diamond', palette.precip, 1)} activeDot={{ r: 5 }} isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {days.map((d) => {
              const w = describeWeather(d.weatherCode)
              return (
                <li key={d.date} className="rounded-lg bg-surface-2 p-2.5 text-center">
                  <div className="text-[11px] font-medium text-muted">{formatDayLabel(d.date)}</div>
                  <WeatherIcon kind={w.kind} className="mx-auto my-1.5 text-accent-strong" width={24} height={24} />
                  <div className="text-[11px] text-muted">{w.label}</div>
                  <div className="mt-1 font-mono text-xs tabular-nums text-ink">
                    {formatTemp(d.tMax, unit)} / {formatTemp(d.tMin, unit)}
                  </div>
                  <div className="mt-1.5 flex justify-center">
                    <AqiBadge aqi={d.aqiMax} size="sm" />
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="mt-2 text-[11px] text-muted">카드의 AQI 배지는 해당 일의 시간별 최댓값입니다.</p>
        </>
      )}
    </Panel>
  )
}
