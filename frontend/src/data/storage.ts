import type { ProductOption, SetOption } from '../types'

const SETS_KEY = 'hit-rate-calculator.sets'
const PRODUCTS_KEY = 'hit-rate-calculator.products'
const SELECTED_SET_KEY = 'hit-rate-calculator.selected-set'
const CURRENCY_KEY = 'hit-rate-calculator.currency'
const EXCHANGE_RATE_KEY = 'hit-rate-calculator.eur-huf-rate'

export type Currency = 'EUR' | 'HUF'

type CachedExchangeRate = {
  rate: number
  fetchedAt: number
}

export function readCachedSets(): SetOption[] {
  try {
    const value = localStorage.getItem(SETS_KEY)
    return value ? (JSON.parse(value) as SetOption[]) : []
  } catch {
    return []
  }
}

export function writeCachedSets(sets: SetOption[]): void {
  localStorage.setItem(SETS_KEY, JSON.stringify(sets))
}

export function readCachedProducts(): ProductOption[] {
  try {
    const value = localStorage.getItem(PRODUCTS_KEY)
    return value ? (JSON.parse(value) as ProductOption[]) : []
  } catch {
    return []
  }
}

export function writeCachedProducts(products: ProductOption[]): void {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
}

export function readSelectedSet(): number | null {
  const value = localStorage.getItem(SELECTED_SET_KEY)
  return value ? Number(value) : null
}

export function writeSelectedSet(setId: number): void {
  localStorage.setItem(SELECTED_SET_KEY, String(setId))
}

export function readCurrency(): Currency {
  return localStorage.getItem(CURRENCY_KEY) === 'HUF' ? 'HUF' : 'EUR'
}

export function writeCurrency(currency: Currency): void {
  localStorage.setItem(CURRENCY_KEY, currency)
}

export function readCachedExchangeRate(): CachedExchangeRate | null {
  try {
    const value = localStorage.getItem(EXCHANGE_RATE_KEY)
    if (!value) return null

    const cached = JSON.parse(value) as CachedExchangeRate
    const hasValidTimestamp = Number.isFinite(cached.fetchedAt)
    const hasValidRate = Number.isFinite(cached.rate)
    return hasValidRate && hasValidTimestamp
      ? cached
      : null
  } catch {
    return null
  }
}

export function writeCachedExchangeRate(rate: number): void {
  localStorage.setItem(
    EXCHANGE_RATE_KEY,
    JSON.stringify({ rate, fetchedAt: Date.now() }),
  )
}
