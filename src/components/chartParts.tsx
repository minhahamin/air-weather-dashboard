import type { ReactNode } from 'react'
import { useSettings } from '../hooks/settings'
import type { MarkerShape } from '../lib/palette'

export interface MarkerProps {
  cx?: number
  cy?: number
  index?: number
}

/** 마커 모양 SVG (색 외 구분 수단). */
export function Marker({ shape, cx = 0, cy = 0, color, size = 4.5 }: { shape: MarkerShape; cx?: number; cy?: number; color: string; size?: number }) {
  const common = { fill: color, stroke: 'var(--surface)', strokeWidth: 1 }
  switch (shape) {
    case 'square':
      return <rect x={cx - size} y={cy - size} width={size * 2} height={size * 2} {...common} />
    case 'triangle':
      return <polygon points={`${cx},${cy - size - 1} ${cx + size + 1},${cy + size} ${cx - size - 1},${cy + size}`} {...common} />
    case 'diamond':
      return <polygon points={`${cx},${cy - size - 1} ${cx + size + 1},${cy} ${cx},${cy + size + 1} ${cx - size - 1},${cy}`} {...common} />
    default:
      return <circle cx={cx} cy={cy} r={size} {...common} />
  }
}

/** n개마다 마커를 그리는 dot 렌더러 (전부 그리면 선이 가려진다). */
export function makeDot(shape: MarkerShape, color: string, every: number) {
  return (props: MarkerProps) => {
    const i = props.index ?? 0
    if (i % every !== 0 || props.cx == null || props.cy == null) return <g key={`d-${i}`} />
    return <Marker key={`d-${i}`} shape={shape} cx={props.cx} cy={props.cy} color={color} />
  }
}

export interface LegendItem {
  label: string
  color: string
  dash: string
  shape: MarkerShape | 'bar'
}

export function SeriesLegend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="범례">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5">
          <svg width="30" height="12" aria-hidden="true">
            {it.shape === 'bar' ? (
              <>
                <rect x="4" y="1" width="22" height="10" fill={it.color} opacity="0.35" />
                <path d="M4 11 12 1M10 11 18 1M16 11 24 1M22 11 28 1" stroke={it.color} strokeWidth="1.2" />
              </>
            ) : (
              <>
                <line x1="0" x2="30" y1="6" y2="6" stroke={it.color} strokeWidth="2" strokeDasharray={it.dash} />
                <Marker shape={it.shape} cx={15} cy={6} color={it.color} size={3.5} />
              </>
            )}
          </svg>
          <span className="text-ink">{it.label}</span>
        </li>
      ))}
    </ul>
  )
}

export interface TooltipRow {
  label: string
  value: string
  color?: string
}

interface TooltipProps {
  active?: boolean
  payload?: readonly { payload?: unknown }[]
  /** payload의 원본 데이터 한 점 -> 제목/행 */
  build: (point: never) => { title: string; rows: TooltipRow[]; footer?: ReactNode }
}

/** Recharts 기본 툴팁 대신 쓰는 커스텀 툴팁. */
export function ChartTooltip({ active, payload, build }: TooltipProps) {
  const { palette } = useSettings()
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  const { title, rows, footer } = build(point as never)
  return (
    <div
      className="min-w-40 rounded-lg border px-3 py-2 text-xs shadow-lg"
      style={{ background: palette.tooltipBg, borderColor: palette.tooltipBorder, color: palette.text }}
    >
      <div className="mb-1.5 font-mono font-semibold">{title}</div>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              {r.color && <span className="inline-block h-2 w-2 rounded-sm" style={{ background: r.color }} aria-hidden="true" />}
              {r.label}
            </span>
            <span className="font-mono font-semibold tabular-nums">{r.value}</span>
          </li>
        ))}
      </ul>
      {footer}
    </div>
  )
}

/** 빗금 패턴 (막대 차트를 색 없이도 구분하기 위함) */
export function HatchDefs({ id, color }: { id: string; color: string }) {
  return (
    <defs>
      <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="6" fill={color} fillOpacity="0.18" />
        <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth="2" />
      </pattern>
    </defs>
  )
}
