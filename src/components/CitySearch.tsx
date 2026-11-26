import { useEffect, useId, useRef, useState } from 'react'
import { useDebounced } from '../hooks/useDebounced'
import { useCitySearch } from '../hooks/queries'
import { citySubLabel } from '../lib/api'
import type { City } from '../lib/types'
import { PinIcon, SearchIcon } from './Icons'

interface Props {
  recent: City[]
  onSelect: (city: City) => void
  placeholder?: string
  label?: string
}

export function CitySearch({ recent, onSelect, placeholder = '도시 검색 (예: 부산, Tokyo)', label = '도시 검색' }: Props) {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const debounced = useDebounced(text, 300)
  const { data, isFetching, isError } = useCitySearch(debounced)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const searching = text.trim().length >= 2
  const items: City[] = searching ? (data ?? []) : recent
  const waiting = searching && (debounced !== text || isFetching)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const choose = (c: City) => {
    onSelect(c)
    setText('')
    setOpen(false)
    setActive(0)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, Math.max(items.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      const c = items[active]
      if (open && c) {
        e.preventDefault()
        choose(c)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" width={18} height={18} />
        <input
          type="search"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && items[active] ? `${listId}-${active}` : undefined}
          value={text}
          placeholder={placeholder}
          onChange={(e) => {
            setText(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="field w-full pl-9"
        />
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={searching ? '검색 결과' : '최근 검색 도시'}
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-line bg-surface py-1 shadow-lg"
        >
          {!searching && (
            <li role="presentation" className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
              최근 검색
            </li>
          )}
          {waiting && items.length === 0 && (
            <li role="presentation" className="px-3 py-2 text-sm text-muted">
              검색 중...
            </li>
          )}
          {isError && (
            <li role="presentation" className="px-3 py-2 text-sm text-[#d94a4a]">
              검색에 실패했습니다. 잠시 후 다시 시도해 주세요.
            </li>
          )}
          {!waiting && !isError && items.length === 0 && (
            <li role="presentation" className="px-3 py-2 text-sm text-muted">
              {searching ? '검색 결과가 없습니다.' : '최근 검색한 도시가 없습니다. 2글자 이상 입력해 보세요.'}
            </li>
          )}
          {items.map((c, i) => (
            <li
              key={c.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(c)
              }}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm ${i === active ? 'bg-accent-soft' : ''}`}
            >
              <PinIcon width={15} height={15} className="shrink-0 text-accent-strong" />
              <span className="font-medium text-ink">{c.name}</span>
              <span className="truncate text-xs text-muted">{citySubLabel(c)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
