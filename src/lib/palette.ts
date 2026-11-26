export interface ChartPalette {
  grid: string
  axis: string
  temp: string
  precip: string
  pm25: string
  pm10: string
  tooltipBg: string
  tooltipBorder: string
  text: string
  /** 도시 비교용 4색 */
  series: [string, string, string, string]
}

export const LIGHT: ChartPalette = {
  grid: '#dcdad0',
  axis: '#5c6a61',
  temp: '#b5532f',
  precip: '#3a6f8f',
  pm25: '#3f6048',
  pm10: '#7a5c1e',
  tooltipBg: '#fbfaf6',
  tooltipBorder: '#c9c7bb',
  text: '#1f2a24',
  series: ['#3f6048', '#b5532f', '#3a6f8f', '#8a6a14'],
}

export const DARK: ChartPalette = {
  grid: '#2e3a32',
  axis: '#9aa99f',
  temp: '#f0956f',
  precip: '#6fb0d3',
  pm25: '#9fcca7',
  pm10: '#d9b45a',
  tooltipBg: '#1a211c',
  tooltipBorder: '#3b4a40',
  text: '#e8ede9',
  series: ['#9fcca7', '#f0956f', '#6fb0d3', '#d9b45a'],
}

/** 색 외 구분 수단: 선 모양과 마커 모양을 시리즈마다 다르게 */
export const SERIES_DASH = ['0', '6 3', '2 3', '10 3 2 3'] as const
export const SERIES_MARKER = ['circle', 'square', 'triangle', 'diamond'] as const
export type MarkerShape = (typeof SERIES_MARKER)[number]
