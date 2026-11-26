export type Unit = 'metric' | 'imperial'

export interface City {
  id: string
  name: string
  country: string
  admin1?: string
  latitude: number
  longitude: number
}

export interface CurrentConditions {
  time: string
  temp: number | null
  apparent: number | null
  humidity: number | null
  wind: number | null
  weatherCode: number | null
  pm25: number | null
  pm10: number | null
  aqi: number | null
}

export interface HourlyPoint {
  time: string
  temp: number | null
  precip: number | null
  precipProb: number | null
  pm25: number | null
  pm10: number | null
  aqi: number | null
}

export interface DailyPoint {
  date: string
  tMax: number | null
  tMin: number | null
  precipSum: number | null
  weatherCode: number | null
  aqiMax: number | null
  pm25Avg: number | null
}

export interface CityData {
  timezone: string
  current: CurrentConditions
  hourly: HourlyPoint[]
  daily: DailyPoint[]
  airAvailable: boolean
}
