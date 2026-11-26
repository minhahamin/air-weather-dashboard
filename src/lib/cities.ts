import type { City } from './types'

export const DEFAULT_CITY: City = {
  id: '1835848',
  name: '서울특별시',
  country: '대한민국',
  admin1: '서울특별시',
  latitude: 37.566,
  longitude: 126.9784,
}

/** 비교 뷰 초기값 (사용자가 바꾸면 localStorage에 저장) */
export const DEFAULT_COMPARE: City[] = [
  DEFAULT_CITY,
  { id: '1850147', name: '도쿄', country: '일본', admin1: '도쿄도', latitude: 35.6895, longitude: 139.69171 },
  { id: '5128581', name: '뉴욕', country: '미국', admin1: '뉴욕', latitude: 40.71427, longitude: -74.00597 },
]

export const MAX_RECENT = 6
export const MAX_COMPARE = 4
export const MIN_COMPARE = 2

/** 최근 검색 목록 갱신: 맨 앞에 추가, 중복 제거, 개수 제한 */
export function pushRecent(list: City[], city: City, max = MAX_RECENT): City[] {
  return [city, ...list.filter((c) => c.id !== city.id)].slice(0, max)
}
