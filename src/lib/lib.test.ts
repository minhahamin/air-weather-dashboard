import { describe, expect, it } from 'vitest'
import { getAqiGrade } from './aqi'
import { cToF, convertTemp, fToC, formatTemp } from './units'
import { buildCityData, formatDayLabel, formatHourLabel, mergeHourly, sliceFromNow, summarizeAirByDate } from './transform'
import { filterRows, repeatRows, sortRows } from './tableLogic'
import { describeWeather } from './weatherCode'
import { pushRecent } from './cities'
import type { City, HourlyPoint } from './types'

describe('getAqiGrade', () => {
  it.each([
    [0, '좋음'],
    [50, '좋음'],
    [51, '보통'],
    [100, '보통'],
    [101, '민감군 나쁨'],
    [150, '민감군 나쁨'],
    [151, '나쁨'],
    [200, '나쁨'],
    [201, '매우 나쁨'],
    [300, '매우 나쁨'],
    [301, '위험'],
    [999, '위험'],
  ])('AQI %i -> %s', (v, label) => {
    expect(getAqiGrade(v)?.label).toBe(label)
  })
  it('소수는 반올림하여 경계를 판정한다', () => {
    expect(getAqiGrade(50.4)?.label).toBe('좋음')
    expect(getAqiGrade(50.6)?.label).toBe('보통')
  })
  it('null/NaN/음수는 null', () => {
    expect(getAqiGrade(null)).toBeNull()
    expect(getAqiGrade(undefined)).toBeNull()
    expect(getAqiGrade(NaN)).toBeNull()
    expect(getAqiGrade(-1)).toBeNull()
  })
})

describe('units', () => {
  it('섭씨/화씨 변환', () => {
    expect(cToF(0)).toBe(32)
    expect(cToF(100)).toBe(212)
    expect(cToF(-40)).toBe(-40)
    expect(fToC(212)).toBeCloseTo(100)
    expect(fToC(cToF(23.4))).toBeCloseTo(23.4)
  })
  it('convertTemp는 metric이면 그대로, null이면 null', () => {
    expect(convertTemp(20, 'metric')).toBe(20)
    expect(convertTemp(20, 'imperial')).toBe(68)
    expect(convertTemp(null, 'imperial')).toBeNull()
  })
  it('formatTemp', () => {
    expect(formatTemp(20, 'metric')).toBe('20°C')
    expect(formatTemp(20, 'imperial')).toBe('68°F')
    expect(formatTemp(20.26, 'metric', 1)).toBe('20.3°C')
    expect(formatTemp(null, 'metric')).toBe('-')
  })
})

describe('transform', () => {
  const weather = {
    time: ['2026-01-01T00:00', '2026-01-01T01:00', '2026-01-01T02:00'],
    temperature_2m: [1, null, 3],
    precipitation: [0, 0.2, 0],
    precipitation_probability: [10, 20, 30],
  }
  // 대기질은 시간 범위가 다르다: 01시, 02시, 03시
  const air = {
    time: ['2026-01-01T01:00', '2026-01-01T02:00', '2026-01-01T03:00'],
    pm2_5: [10, 20, 30],
    pm10: [15, 25, 35],
    us_aqi: [40, 60, null],
  }

  it('mergeHourly는 시간 키로 정확히 병합하고 없는 값은 null', () => {
    const m = mergeHourly(weather, air)
    expect(m).toHaveLength(3)
    expect(m[0]).toMatchObject({ temp: 1, pm25: null, aqi: null })
    expect(m[1]).toMatchObject({ temp: null, pm25: 10, aqi: 40 })
    expect(m[2]).toMatchObject({ temp: 3, pm25: 20, aqi: 60 })
  })
  it('대기질이 없어도 병합된다', () => {
    expect(mergeHourly(weather, null).every((p) => p.pm25 == null)).toBe(true)
    expect(mergeHourly(undefined, null)).toEqual([])
  })
  it('summarizeAirByDate: 최대 AQI와 PM2.5 평균', () => {
    const t = ['2026-01-01T00:00', '2026-01-01T01:00', '2026-01-02T00:00']
    const hourly = mergeHourly({ time: t }, { time: t, pm2_5: [10, 30, null], us_aqi: [40, 90, null] })
    const s = summarizeAirByDate(hourly)
    expect(s.get('2026-01-01')).toEqual({ aqiMax: 90, pm25Avg: 20 })
    expect(s.get('2026-01-02')).toEqual({ aqiMax: null, pm25Avg: null })
  })
  it('buildCityData: 현재값과 일별 요약 구성', () => {
    const d = buildCityData(
      {
        timezone: 'Asia/Seoul',
        current: { time: '2026-01-01T01:00', temperature_2m: 5, apparent_temperature: 3, relative_humidity_2m: 50, wind_speed_10m: 7, weather_code: 3 },
        hourly: weather,
        daily: { time: ['2026-01-01'], temperature_2m_max: [3], temperature_2m_min: [1], precipitation_sum: [0.2], weather_code: [3] },
      },
      { current: { time: 'x', pm2_5: 12, pm10: 20, us_aqi: 50 }, hourly: air },
    )
    expect(d.current).toMatchObject({ temp: 5, humidity: 50, pm25: 12, aqi: 50 })
    expect(d.daily[0]).toMatchObject({ tMax: 3, aqiMax: 60 })
    expect(d.airAvailable).toBe(true)
    expect(buildCityData({ timezone: 'UTC' }, null).airAvailable).toBe(false)
  })
  it('sliceFromNow는 현재 시각의 시(hour) 이후부터 자른다', () => {
    const h = mergeHourly(weather, null)
    expect(sliceFromNow(h, '2026-01-01T01:15', 2).map((p) => p.time)).toEqual(['2026-01-01T01:00', '2026-01-01T02:00'])
    expect(sliceFromNow(h, '2030-01-01T00:00', 2)).toHaveLength(2)
  })
  it('날짜 라벨', () => {
    expect(formatHourLabel('2026-11-26T20:00')).toBe('11/26 20시')
    expect(formatDayLabel('2026-11-26')).toBe('11/26 (목)')
  })
})

describe('tableLogic', () => {
  const mk = (time: string, temp: number | null, aqi: number | null): HourlyPoint => ({
    time,
    temp,
    precip: 0,
    precipProb: 0,
    pm25: null,
    pm10: null,
    aqi,
  })
  const rows = [mk('2026-01-01T02:00', 5, 120), mk('2026-01-01T01:00', null, 30), mk('2026-01-01T03:00', 9, 80)]

  it('정렬: 오름/내림, null은 항상 뒤', () => {
    expect(sortRows(rows, 'temp', 'asc').map((r) => r.temp)).toEqual([5, 9, null])
    expect(sortRows(rows, 'temp', 'desc').map((r) => r.temp)).toEqual([9, 5, null])
    expect(sortRows(rows, 'time', 'asc')[0]?.time).toBe('2026-01-01T01:00')
  })
  it('정렬은 원본을 변경하지 않는다', () => {
    const copy = [...rows]
    sortRows(rows, 'aqi', 'asc')
    expect(rows).toEqual(copy)
  })
  it('검색: 시각, 등급명, AQI 숫자', () => {
    expect(filterRows(rows, '')).toHaveLength(3)
    expect(filterRows(rows, '03시')).toHaveLength(1)
    expect(filterRows(rows, '민감군')).toHaveLength(1)
    expect(filterRows(rows, '좋음')).toHaveLength(1)
    expect(filterRows(rows, '80')).toHaveLength(1)
    expect(filterRows(rows, '없는값')).toHaveLength(0)
  })
  it('repeatRows', () => {
    expect(repeatRows(rows, 1)).toBe(rows)
    expect(repeatRows(rows, 10)).toHaveLength(30)
  })
})

describe('misc', () => {
  it('describeWeather', () => {
    expect(describeWeather(0).label).toBe('맑음')
    expect(describeWeather(63).kind).toBe('rain')
    expect(describeWeather(95).kind).toBe('storm')
    expect(describeWeather(null).label).toBe('알 수 없음')
  })
  it('pushRecent: 중복 제거, 앞에 추가, 최대 개수', () => {
    const c = (id: string): City => ({ id, name: id, country: '', latitude: 0, longitude: 0 })
    const list = pushRecent([c('a'), c('b'), c('c')], c('b'), 3)
    expect(list.map((x) => x.id)).toEqual(['b', 'a', 'c'])
    expect(pushRecent(list, c('d'), 3).map((x) => x.id)).toEqual(['d', 'b', 'a'])
  })
})
