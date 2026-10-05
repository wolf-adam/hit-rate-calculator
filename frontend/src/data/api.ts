import axios from 'axios'
import type {
  NewRecord,
  Card,
  CardDraft,
  PlayerOption,
  ProductOption,
  ProductAnalytics,
  RecordItem,
  RecordRow,
  RecordUpdate,
  SetOption,
} from '../types'

const client = axios.create({ baseURL: '/api' })
const exchangeClient = axios.create({ baseURL: 'https://api.frankfurter.dev/v1' })

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string' && detail.trim()) return detail
  }
  return fallback
}

export async function fetchSets(): Promise<SetOption[]> {
  const { data } = await client.get<SetOption[]>('/sets')
  return data
}

export async function fetchPlayers(): Promise<PlayerOption[]> {
  const { data } = await client.get<PlayerOption[]>('/players')
  return data
}

export async function createPlayer(player: {
  first_name: string
  last_name: string
}): Promise<PlayerOption> {
  const { data } = await client.post<PlayerOption>('/players', player)
  return data
}

export async function fetchProducts(): Promise<ProductOption[]> {
  const { data } = await client.get<ProductOption[]>('/products')
  return data
}

export async function fetchCards(): Promise<Card[]> {
  const { data } = await client.get<Card[]>('/cards')
  return data
}

export async function createCard(card: Omit<CardDraft, 'card_id' | 'price'> & {
  price: number
}): Promise<Card> {
  const { data } = await client.post<Card>('/cards', card)
  return data
}

export async function updateCard(
  cardId: number,
  card: Omit<CardDraft, 'card_id' | 'price'> & { price: number },
): Promise<Card> {
  const { data } = await client.put<Card>(`/cards/${cardId}`, card)
  return data
}

export async function fetchRecords(
  setId: number,
): Promise<RecordRow[]> {
  const { data } = await client.get<RecordRow[]>('/records', {
    params: { set_id: setId },
  })
  return data
}

export async function fetchRecordsForModal(
  setId: number,
): Promise<RecordRow[]> {
  const { data } = await client.get<RecordRow[]>('/records/modal', {
    params: { set_id: setId },
  })
  return data
}

export async function fetchProductAnalytics(
  setId: number,
): Promise<ProductAnalytics[]> {
  const { data } = await client.get<ProductAnalytics[]>('/product-analytics', {
    params: { set_id: setId },
  })
  return data
}

export async function createRecord(
  record: NewRecord,
): Promise<RecordRow> {
  const { data } = await client.post<RecordRow>('/records', record)
  return data
}

export async function updateRecord(
  recordId: number,
  record: RecordUpdate,
): Promise<RecordItem> {
  const { data } = await client.put<RecordItem>(`/records/${recordId}`, record)
  return data
}

export async function fetchEurToHufRate(): Promise<number> {
  const { data } = await exchangeClient.get<{ rates: { HUF: number } }>('/latest', {
    params: { base: 'EUR', symbols: 'HUF' },
  })
  return data.rates.HUF
}
