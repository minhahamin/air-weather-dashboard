import type { CityData, CurrentConditions, DailyPoint, HourlyPoint } from './types'

/** Open-Meteo 응답(필요한 부분만) */
export interface RawWeather {
  timezone: string
  current?: {
    time: string
    temperature_2m?: number | null
    apparent_temperature?: number | null
    relative_humidity_2m?: number | null
    wind_speed_10m?: number | null
    weather_code?: number | null
  }
  hourly?: {
    time: string[]
    temperature_2m?: (number | null)[]
    precipitation?: (number | null)[]
    precipitation_probability?: (number | null)[]
  }
  daily?: {
    time: string[]
    temperature_2m_max?: (number | null)[]
    temperature_2m_min?: (number | null)[]
    precipitation_sum?: (number | null)[]
    weather_code?: (number | null)[]
  }
}

export interface RawAir {
  current?: { time: string; pm2_5?: number | null; pm10?: number | null; us_aqi?: number | null }
  hourly?: {
    time: string[]
    pm2_5?: (number | null)[]
    pm10?: (number | null)[]
    us_aqi?: (number | null)[]
  }
}

const num = (v: number | null | undefined): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null

/** 시간(ISO 로컬 문자열)을 키로 날씨와 대기질 시계열을 병합한다. */
export function mergeHourly(weather: RawWeather['hourly'], air: RawAir['hourly'] | null): HourlyPoint[] {
  if (!weather) return []
  const airIndex = new Map<string, number>()
  air?.time.forEach((t, i) => airIndex.set(t, i))

  return weather.time.map((time, i) => {
    const j = airIndex.get(time)
    return {
      time,
      temp: num(weather.temperature_2m?.[i]),
      precip: num(weather.precipitation?.[i]),
      precipProb: num(weather.precipitation_probability?.[i]),
      pm25: j == null ? null : num(air?.pm2_5?.[j]),
      pm10: j == null ? null : num(air?.pm10?.[j]),
      aqi: j == null ? null : num(air?.us_aqi?.[j]),
    }
  })
}

/** 시간별 대기질에서 일 단위 요약(최대 AQI, 평균 PM2.5)을 계산한다. */
export function summarizeAirByDate(
  hourly: HourlyPoint[],
): Map<string, { aqiMax: number | null; pm25Avg: number | null }> {
  const acc = new Map<string, { aqiMax: number | null; sum: number; n: number }>()
  for (const p of hourly) {
    const date = p.time.slice(0, 10)
    const cur = acc.get(date) ?? { aqiMax: null, sum: 0, n: 0 }
    if (p.aqi != null) cur.aqiMax = cur.aqiMax == null ? p.aqi : Math.max(cur.aqiMax, p.aqi)
    if (p.pm25 != null) {
      cur.sum += p.pm25
      cur.n += 1
    }
    acc.set(date, cur)
  }
  const out = new Map<string, { aqiMax: number | null; pm25Avg: number | null }>()
  acc.forEach((v, k) => out.set(k, { aqiMax: v.aqiMax, pm25Avg: v.n ? v.sum / v.n : null }))
  return out
}

export function buildDaily(weather: RawWeather['daily'], hourly: HourlyPoint[]): DailyPoint[] {
  if (!weather) return []
  const air = summarizeAirByDate(hourly)
  return weather.time.map((date, i) => ({
    date,
    tMax: num(weather.temperature_2m_max?.[i]),
    tMin: num(weather.temperature_2m_min?.[i]),
    precipSum: num(weather.precipitation_sum?.[i]),
    weatherCode: num(weather.weather_code?.[i]),
    aqiMax: air.get(date)?.aqiMax ?? null,
    pm25Avg: air.get(date)?.pm25Avg ?? null,
  }))
}

export function buildCityData(weather: RawWeather, air: RawAir | null): CityData {
  const hourly = mergeHourly(weather.hourly, air?.hourly ?? null)
  const c = weather.current
  const current: CurrentConditions = {
    time: c?.time ?? '',
    temp: num(c?.temperature_2m),
    apparent: num(c?.apparent_temperature),
    humidity: num(c?.relative_humidity_2m),
    wind: num(c?.wind_speed_10m),
    weatherCode: num(c?.weather_code),
    pm25: num(air?.current?.pm2_5),
    pm10: num(air?.current?.pm10),
    aqi: num(air?.current?.us_aqi),
  }
  return {
    timezone: weather.timezone,
    current,
    hourly,
    daily: buildDaily(weather.daily, hourly),
    airAvailable: air != null,
  }
}

/** 현재 시각(해당 도시 현지 시각) 이후의 시간별 데이터 N개를 잘라낸다. */
export function sliceFromNow(hourly: HourlyPoint[], nowLocalIso: string, count: number): HourlyPoint[] {
  const hourKey = nowLocalIso.slice(0, 13) // YYYY-MM-DDTHH
  let start = hourly.findIndex((p) => p.time.slice(0, 13) >= hourKey)
  if (start < 0) start = Math.max(0, hourly.length - count)
  return hourly.slice(start, start + count)
}

/** "2026-11-26T20:00" -> "11/26 20시" */
export function formatHourLabel(time: string): string {
  return `${time.slice(5, 7)}/${time.slice(8, 10)} ${time.slice(11, 13)}시`
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
/** "2026-11-26" -> "11/26 (목)" - 타임존 영향이 없도록 UTC로 해석 */
export function formatDayLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const wd = WEEKDAYS[new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)).getUTCDay()]
  return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')} (${wd})`
}
