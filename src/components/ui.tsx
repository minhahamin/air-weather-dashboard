import type { ReactNode } from 'react'
import { getAqiGrade } from '../lib/aqi'
import { AlertIcon, InboxIcon } from './Icons'

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} aria-hidden="true" />
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-line bg-surface px-6 py-10 text-center">
      <AlertIcon width={28} height={28} className="text-[#d94a4a]" />
      <p className="text-sm text-ink">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn">
          다시 시도
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-muted">
      <InboxIcon width={28} height={28} />
      <p className="text-sm font-medium text-ink">{title}</p>
      {hint && <p className="text-xs">{hint}</p>}
    </div>
  )
}

export function Panel({ title, aside, children, className = '' }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-surface ${className}`}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold tracking-wide text-ink">{title}</h2>
        {aside}
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}

/** 색 + 등급명 + 기호를 함께 표시해 색에만 의존하지 않는다. */
export function AqiBadge({ aqi, size = 'md' }: { aqi: number | null | undefined; size?: 'sm' | 'md' }) {
  const g = getAqiGrade(aqi)
  if (!g) return <span className="text-muted">-</span>
  const pad = size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ${pad}`}
      style={{ background: g.color, color: g.text }}
      title={`US AQI ${Math.round(aqi ?? 0)} - ${g.label}`}
    >
      <span className="font-mono text-[0.9em] opacity-90" aria-hidden="true">
        {g.short}
      </span>
      <span>{Math.round(aqi ?? 0)}</span>
      <span>{g.label}</span>
    </span>
  )
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            o.value === value ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
