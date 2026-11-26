import { buildCityData, type RawAir, type RawWeather } from './transform'
import type { City, CityData } from './types'

const GEO = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST = 'https://api.open-meteo.com/v1/forecast'
const AIR = 'https://air-quality-api.open-meteo.com/v1/air-quality'

/** 표/차트에 쓰는 시간별 범위: 과거 7일 + 예보 7일 = 336행 */
export const PAST_DAYS = 7
export const FORECAST_DAYS = 7

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, { signal })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new ApiError('네트워크에 연결할 수 없습니다.')
  }
  if (!res.ok) {
    throw new ApiError(
      res.status === 429 ? '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' : `서버 오류 (${res.status})`,
      res.status,
    )
  }
  return (await res.json()) as T
}

interface GeoResult {
  id: number
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
}

export async function searchCities(query: string, signal?: AbortSignal): Promise<City[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const url = `${GEO}?name=${encodeURIComponent(q)}&count=8&language=ko&format=json`
  const data = await getJson<{ results?: GeoResult[] }>(url, signal)
  return (data.results ?? []).map((r) => ({
    id: String(r.id),
    name: r.name,
    country: r.country ?? '',
    admin1: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
  }))
}

export async function fetchCityData(city: City, signal?: AbortSignal): Promise<CityData> {
  const common = `latitude=${city.latitude}&longitude=${city.longitude}&timezone=auto&past_days=${PAST_DAYS}&forecast_days=${FORECAST_DAYS}`
  const weatherUrl =
    `${FORECAST}?${common}` +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code' +
    '&hourly=temperature_2m,precipitation,precipitation_probability' +
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code'
  const airUrl = `${AIR}?${common}&current=pm2_5,pm10,us_aqi&hourly=pm2_5,pm10,us_aqi`

  // 날씨는 필수, 대기질은 실패해도 화면을 보여주기 위해 선택 처리
  const [weather, air] = await Promise.all([
    getJson<RawWeather>(weatherUrl, signal),
    getJson<RawAir>(airUrl, signal).catch((e) => {
      if (e instanceof DOMException && e.name === 'AbortError') throw e
      return null
    }),
  ])
  return buildCityData(weather, air)
}

export const cityLabel = (c: City): string => c.name
export const citySubLabel = (c: City): string => [c.admin1, c.country].filter(Boolean).join(', ')
