import { useCallback, useState } from 'react'

function read<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw == null ? initial : (JSON.parse(raw) as T)
  } catch {
    return initial
  }
}

/** localStorage가 막혀 있거나 값이 깨져 있어도 앱이 죽지 않도록 방어한다. */
export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => read(key, initial))

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
        try {
          localStorage.setItem(key, JSON.stringify(v))
        } catch {
          /* 저장 실패는 무시 (메모리 상태만 유지) */
        }
        return v
      })
    },
    [key],
  )

  return [value, set]
}
