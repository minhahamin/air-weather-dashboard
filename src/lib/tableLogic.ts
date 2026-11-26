import { getAqiGrade } from './aqi'
import { formatHourLabel } from './transform'
import type { HourlyPoint } from './types'

export type SortKey = 'time' | 'temp' | 'precip' | 'precipProb' | 'pm25' | 'pm10' | 'aqi'
export type SortDir = 'asc' | 'desc'

/** null은 정렬 방향과 관계없이 항상 뒤로 보낸다. */
export function sortRows(rows: HourlyPoint[], key: SortKey, dir: SortDir): HourlyPoint[] {
  const sign = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (av < bv) return -1 * sign
    if (av > bv) return 1 * sign
    return 0
  })
}

/** 시간 문자열, AQI 등급명, AQI 숫자로 검색한다. */
export function filterRows(rows: HourlyPoint[], query: string): HourlyPoint[] {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((r) => {
    const grade = getAqiGrade(r.aqi)?.label ?? ''
    return (
      r.time.toLowerCase().includes(q) ||
      formatHourLabel(r.time).includes(q) ||
      grade.includes(q) ||
      (r.aqi != null && String(Math.round(r.aqi)) === q)
    )
  })
}

/** 벤치마크용: 같은 데이터를 n배 복제한다 (행 key는 인덱스를 쓴다). */
export function repeatRows(rows: HourlyPoint[], n: number): HourlyPoint[] {
  if (n <= 1) return rows
  const out: HourlyPoint[] = []
  for (let i = 0; i < n; i++) out.push(...rows)
  return out
}
