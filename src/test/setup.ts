import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => cleanup())

// jsdom에는 레이아웃이 없으므로 가상 스크롤이 동작하도록 크기를 지정한다.
Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 480 })
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 900 })

class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver = RO
