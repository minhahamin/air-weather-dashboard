import { useQueries, useQuery } from '@tanstack/react-query'
import { fetchCityData, searchCities } from '../lib/api'
import type { City } from '../lib/types'

const cityKey = (c: City) => ['cityData', c.latitude, c.longitude] as const

const cityQuery = (c: City) => ({
  queryKey: cityKey(c),
  queryFn: ({ signal }: { signal: AbortSignal }) => fetchCityData(c, signal),
  staleTime: 10 * 60 * 1000,
})

export function useCityData(city: City) {
  return useQuery(cityQuery(city))
}

export function useCitiesData(cities: City[]) {
  return useQueries({ queries: cities.map(cityQuery) })
}

export function useCitySearch(term: string) {
  return useQuery({
    queryKey: ['geocode', term],
    queryFn: ({ signal }) => searchCities(term, signal),
    enabled: term.trim().length >= 2,
    staleTime: 60 * 60 * 1000,
  })
}
