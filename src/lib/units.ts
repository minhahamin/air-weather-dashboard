import type { Unit } from './types'

export const cToF = (c: number): number => (c * 9) / 5 + 32
export const fToC = (f: number): number => ((f - 32) * 5) / 9

/** 내부 저장은 항상 섭씨. 표시 직전에만 변환한다. */
export function convertTemp(celsius: number | null | undefined, unit: Unit): number | null {
  if (celsius == null || Number.isNaN(celsius)) return null
  return unit === 'imperial' ? cToF(celsius) : celsius
}

export const unitSymbol = (unit: Unit): string => (unit === 'imperial' ? '°F' : '°C')

export function formatTemp(celsius: number | null | undefined, unit: Unit, digits = 0): string {
  const v = convertTemp(celsius, unit)
  if (v == null) return '-'
  return `${v.toFixed(digits)}${unitSymbol(unit)}`
}

export function formatNumber(v: number | null | undefined, digits = 0, suffix = ''): string {
  if (v == null || Number.isNaN(v)) return '-'
  return `${v.toFixed(digits)}${suffix}`
}
