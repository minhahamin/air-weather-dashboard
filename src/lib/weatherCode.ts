export type WeatherKind = 'clear' | 'partly' | 'cloud' | 'fog' | 'rain' | 'snow' | 'storm'

/** WMO weather interpretation codes -> 한국어 설명 + 아이콘 종류 */
export function describeWeather(code: number | null | undefined): { label: string; kind: WeatherKind } {
  if (code == null) return { label: '알 수 없음', kind: 'cloud' }
  if (code === 0) return { label: '맑음', kind: 'clear' }
  if (code === 1) return { label: '대체로 맑음', kind: 'clear' }
  if (code === 2) return { label: '구름 조금', kind: 'partly' }
  if (code === 3) return { label: '흐림', kind: 'cloud' }
  if (code === 45 || code === 48) return { label: '안개', kind: 'fog' }
  if (code >= 51 && code <= 57) return { label: '이슬비', kind: 'rain' }
  if (code >= 61 && code <= 67) return { label: '비', kind: 'rain' }
  if (code >= 71 && code <= 77) return { label: '눈', kind: 'snow' }
  if (code >= 80 && code <= 82) return { label: '소나기', kind: 'rain' }
  if (code === 85 || code === 86) return { label: '눈 소나기', kind: 'snow' }
  if (code >= 95) return { label: '뇌우', kind: 'storm' }
  return { label: '알 수 없음', kind: 'cloud' }
}
