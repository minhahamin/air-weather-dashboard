import { AQI_GRADES, getAqiGrade } from '../lib/aqi'
import { formatNumber, formatTemp } from '../lib/units'
import { describeWeather } from '../lib/weatherCode'
import { cityLabel, citySubLabel } from '../lib/api'
import type { City, CityData, Unit } from '../lib/types'
import { DropIcon, ThermoIcon, WeatherIcon, WindIcon } from './Icons'
import { AqiBadge, Skeleton } from './ui'

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        {icon}
        {label}
      </div>
      <div className="mt-1 whitespace-nowrap font-mono text-base font-semibold tabular-nums text-ink">{value}</div>
    </div>
  )
}

function AqiScale({ aqi }: { aqi: number | null }) {
  const pct = aqi == null ? null : Math.min(aqi, 300) / 300 * 100
  return (
    <div className="mt-3">
      <div className="relative flex h-2 overflow-hidden rounded-full" aria-hidden="true">
        {AQI_GRADES.slice(0, 5).map((g) => (
          <div
            key={g.level}
            style={{ background: g.color, flex: Math.min(g.max, 300) - Math.max(g.min - 1, 0) }}
          />
        ))}
      </div>
      {pct != null && (
        <div className="relative h-3" aria-hidden="true">
          <div
            className="absolute top-0 h-0 w-0 -translate-x-1/2 border-x-[5px] border-b-[7px] border-x-transparent border-b-ink"
            style={{ left: `${pct}%` }}
          />
        </div>
      )}
      <div className="mt-1 flex justify-between text-[10px] text-muted" aria-hidden="true">
        <span>0</span>
        <span>50</span>
        <span>100</span>
        <span>150</span>
        <span>200</span>
        <span>300+</span>
      </div>
    </div>
  )
}

export function SummarySkeleton() {
  return (
    <div className="rounded-xl border border-line bg-surface p-5" aria-busy="true" aria-label="현재 상태를 불러오는 중">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-16 w-40" />
      <div className="mt-5 grid grid-cols-3 gap-2">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
      <Skeleton className="mt-5 h-24" />
    </div>
  )
}

export function SummaryCard({ city, data, unit }: { city: City; data: CityData; unit: Unit }) {
  const c = data.current
  const w = describeWeather(c.weatherCode)
  const grade = getAqiGrade(c.aqi)

  return (
    <section aria-label="현재 날씨와 대기질" className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">{cityLabel(city)}</h2>
          <p className="text-xs text-muted">{citySubLabel(city)}</p>
        </div>
        <p className="font-mono text-xs text-muted">{c.time.replace('T', ' ')} (현지)</p>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <WeatherIcon kind={w.kind} width={52} height={52} className="shrink-0 text-accent-strong" strokeWidth={1.3} />
        <div>
          <div className="font-mono text-6xl font-semibold leading-none tabular-nums text-ink" data-testid="current-temp">
            {formatTemp(c.temp, unit)}
          </div>
          <div className="mt-1.5 text-sm text-muted">
            {w.label} / 체감 {formatTemp(c.apparent, unit)}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Stat icon={<ThermoIcon width={14} height={14} />} label="체감" value={formatTemp(c.apparent, unit)} />
        <Stat icon={<DropIcon width={14} height={14} />} label="습도" value={formatNumber(c.humidity, 0, '%')} />
        <Stat icon={<WindIcon width={14} height={14} />} label="풍속" value={formatNumber(c.wind, 1, ' km/h')} />
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">대기질</h3>
          {data.airAvailable ? <AqiBadge aqi={c.aqi} /> : <span className="text-xs text-muted">데이터 없음</span>}
        </div>
        {!data.airAvailable ? (
          <p className="mt-2 text-xs text-muted">이 지역의 대기질 데이터를 불러오지 못했습니다. 날씨 정보만 표시합니다.</p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Stat icon={null} label="PM2.5" value={formatNumber(c.pm25, 1, ' ug/m3')} />
              <Stat icon={null} label="PM10" value={formatNumber(c.pm10, 1, ' ug/m3')} />
            </div>
            <AqiScale aqi={c.aqi} />
            <p className="mt-2 text-[11px] text-muted">
              US AQI 기준{grade ? ` / 현재 등급: ${grade.label}` : ''}
            </p>
          </>
        )}
      </div>
    </section>
  )
}
