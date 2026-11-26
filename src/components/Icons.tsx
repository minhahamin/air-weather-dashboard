import type { SVGProps } from 'react'
import type { WeatherKind } from '../lib/weatherCode'

type P = SVGProps<SVGSVGElement>

const base = (p: P): P => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  ...p,
})

export const SearchIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
)
export const SunIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
  </svg>
)
export const MoonIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </svg>
)
export const CloudIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 18a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 10.5a3.8 3.8 0 0 1-.5 7.5Z" />
  </svg>
)
export const PartlyIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="8.5" cy="8.5" r="3" />
    <path d="M8.5 2.5v1.2M2.5 8.5h1.2M4.3 4.3l.9.9M12.7 4.3l-.9.9" />
    <path d="M9 19a4 4 0 0 1-.3-8 5.2 5.2 0 0 1 10 1.6A3.2 3.2 0 0 1 18.3 19Z" />
  </svg>
)
export const RainIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 15a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 7.5a3.8 3.8 0 0 1-.5 7.5Z" />
    <path d="M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5" />
  </svg>
)
export const SnowIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
    <path d="m9.5 4.5 2.5 2 2.5-2M9.5 19.5l2.5-2 2.5 2" />
  </svg>
)
export const FogIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 13a4.5 4.5 0 0 1-.4-8A6 6 0 0 1 18 6.5a3.8 3.8 0 0 1-.5 6.5Z" />
    <path d="M4 17h16M7 20.5h10" />
  </svg>
)
export const StormIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 14a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 6a3.8 3.8 0 0 1-.5 7.5" />
    <path d="m12.5 11-3 5h4l-2 5" />
  </svg>
)
export const ThermoIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0Z" />
  </svg>
)
export const DropIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5s6 6 6 10.5a6 6 0 0 1-12 0C6 9.5 12 3.5 12 3.5Z" />
  </svg>
)
export const WindIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 9h10a2.5 2.5 0 1 0-2.5-2.5M3 14h14a2.5 2.5 0 1 1-2.5 2.5M3 19h6" />
  </svg>
)
export const AlertIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5 2.8 19.5h18.4Z" />
    <path d="M12 10v4.5M12 17.2v.1" />
  </svg>
)
export const InboxIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 13.5 6 5h12l2.5 8.5V19h-17Z" />
    <path d="M3.5 13.5H9a3 3 0 0 0 6 0h5.5" />
  </svg>
)
export const CloseIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
)
export const ArrowIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
)
export const PinIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s6.5-5.8 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5.2 6.5 11 6.5 11Z" />
    <circle cx="12" cy="10" r="2.3" />
  </svg>
)

export function WeatherIcon({ kind, ...p }: { kind: WeatherKind } & P) {
  switch (kind) {
    case 'clear':
      return <SunIcon {...p} />
    case 'partly':
      return <PartlyIcon {...p} />
    case 'fog':
      return <FogIcon {...p} />
    case 'rain':
      return <RainIcon {...p} />
    case 'snow':
      return <SnowIcon {...p} />
    case 'storm':
      return <StormIcon {...p} />
    default:
      return <CloudIcon {...p} />
  }
}

export const Logo = (p: P) => (
  <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true" {...p}>
    <rect width="32" height="32" rx="8" fill="var(--accent)" />
    <path d="M6 21c4-8 8-8 10-3s6 4 10-5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
  </svg>
)
