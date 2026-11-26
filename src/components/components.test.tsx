import { describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AqiBadge } from './ui'
import { SummaryCard } from './SummaryCard'
import { DataTable } from './DataTable'
import type { City, CityData, HourlyPoint } from '../lib/types'

const city: City = { id: '1', name: '서울', country: '대한민국', latitude: 0, longitude: 0 }

const hourly: HourlyPoint[] = Array.from({ length: 300 }, (_, i) => ({
  time: `2026-01-${String(1 + Math.floor(i / 24)).padStart(2, '0')}T${String(i % 24).padStart(2, '0')}:00`,
  temp: i % 30,
  precip: 0,
  precipProb: 10,
  pm25: i % 50,
  pm10: i % 70,
  aqi: i % 160,
}))

const data: CityData = {
  timezone: 'Asia/Seoul',
  airAvailable: true,
  current: { time: '2026-01-01T10:00', temp: 20, apparent: 18, humidity: 55, wind: 3.2, weatherCode: 0, pm25: 12.3, pm10: 30, aqi: 120 },
  hourly,
  daily: [],
}

describe('AqiBadge', () => {
  it('등급명과 값을 텍스트로 표시한다 (색에만 의존하지 않음)', () => {
    render(<AqiBadge aqi={120} />)
    expect(screen.getByText('민감군 나쁨')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
  })
  it('값이 없으면 대시', () => {
    render(<AqiBadge aqi={null} />)
    expect(screen.getByText('-')).toBeInTheDocument()
  })
})

describe('SummaryCard', () => {
  it('단위에 따라 기온을 변환해 표시한다', () => {
    const { rerender } = render(<SummaryCard city={city} data={data} unit="metric" />)
    expect(screen.getByTestId('current-temp')).toHaveTextContent('20°C')
    rerender(<SummaryCard city={city} data={data} unit="imperial" />)
    expect(screen.getByTestId('current-temp')).toHaveTextContent('68°F')
  })
  it('대기질 데이터가 없으면 안내 문구를 보여준다', () => {
    render(<SummaryCard city={city} data={{ ...data, airAvailable: false }} unit="metric" />)
    expect(screen.getByText(/대기질 데이터를 불러오지 못했습니다/)).toBeInTheDocument()
  })
})

describe('DataTable', () => {
  it('가상화 모드에서는 전체 행 대신 일부만 렌더링한다', async () => {
    render(<DataTable data={data} unit="metric" />)
    expect(screen.getByTestId('row-count')).toHaveTextContent('300')
    await waitFor(() => expect(document.querySelectorAll('[data-row]').length).toBeGreaterThan(0))
    const rendered = document.querySelectorAll('[data-row]').length
    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(60)
  })
  it('전체 렌더 모드에서는 모든 행을 렌더링한다', async () => {
    render(<DataTable data={data} unit="metric" />)
    await userEvent.click(screen.getByRole('button', { name: '전체 렌더' }))
    expect(document.querySelectorAll('[data-row]').length).toBe(300)
  })
  it('헤더 클릭으로 정렬 방향이 바뀐다', async () => {
    render(<DataTable data={data} unit="metric" />)
    const header = screen.getByRole('columnheader', { name: /기온/ })
    expect(header).toHaveAttribute('aria-sort', 'none')
    await userEvent.click(within(header).getByRole('button'))
    expect(header).toHaveAttribute('aria-sort', 'descending')
    await userEvent.click(within(header).getByRole('button'))
    expect(header).toHaveAttribute('aria-sort', 'ascending')
  })
  it('검색어에 맞는 행이 없으면 빈 상태를 보여준다', async () => {
    render(<DataTable data={data} unit="metric" />)
    await userEvent.type(screen.getByLabelText('표 검색'), '존재하지않음')
    await waitFor(() => expect(screen.getByText('조건에 맞는 행이 없습니다.')).toBeInTheDocument())
  })
})
