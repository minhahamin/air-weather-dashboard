/** US AQI 기준 (Open-Meteo `us_aqi` 값과 동일한 척도). */
export interface AqiGrade {
  level: 0 | 1 | 2 | 3 | 4 | 5
  label: string
  /** 색에 의존하지 않도록 함께 표시하는 짧은 기호 */
  short: string
  color: string
  /** 컬러 배경 위 텍스트 색 */
  text: string
  min: number
  max: number
}

export const AQI_GRADES: readonly AqiGrade[] = [
  { level: 0, label: '좋음', short: 'G', color: '#2f9e5b', text: '#ffffff', min: 0, max: 50 },
  { level: 1, label: '보통', short: 'M', color: '#e3b82b', text: '#2b2300', min: 51, max: 100 },
  { level: 2, label: '민감군 나쁨', short: 'S', color: '#ee8a2b', text: '#2b1500', min: 101, max: 150 },
  { level: 3, label: '나쁨', short: 'U', color: '#d94a4a', text: '#ffffff', min: 151, max: 200 },
  { level: 4, label: '매우 나쁨', short: 'V', color: '#8c4fb0', text: '#ffffff', min: 201, max: 300 },
  { level: 5, label: '위험', short: 'H', color: '#7a1f3a', text: '#ffffff', min: 301, max: 500 },
]

export function getAqiGrade(aqi: number | null | undefined): AqiGrade | null {
  if (aqi == null || Number.isNaN(aqi) || aqi < 0) return null
  const v = Math.round(aqi)
  for (const g of AQI_GRADES) {
    if (v <= g.max) return g
  }
  return AQI_GRADES[AQI_GRADES.length - 1] ?? null
}
