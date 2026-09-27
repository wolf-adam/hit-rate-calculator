export type SetOption = {
  id: number
  short_name: string
  long_name: string
  ex: number
  ir: number
  sir: number
  cc?: number
  fr?: number
  hr?: number
}

export type PlayerOption = {
  id: number
  name: string
}

export type ProductOption = {
  id: number
  name: string
}

export type ProductAnalytics = {
  id: number
  name: string
  booster_volume: number
  opening_count: number
  total_boosters: number
  ex: number
  ir: number
  sir: number
  fr: number
  hr: number
  cc: number
  rarity_rates: Record<string, number>
  total_hits: number
  no_hit_boosters: number
  hit_rate: number
  no_hit_rate: number
  one_in_x: number | null
}

export type Card = {
  id: number
  name: string
  link: string
  image_src: string
  price: number
}

export type CardDraft = {
  card_id?: number
  name: string
  link: string
  image_src: string
  price: string
}

export type RecordRow = {
  id: number
  card_id?: number
  name: string
  ex: number
  ir: number
  sir: number
  cc?: number
  fr?: number
  hr?: number
  total: number
  biggest_hit_link: string
  biggest_hit_src: string | null
  in_product_id: number
  price: number
  total_boosters: number
  items: RecordItem[]
  card?: Card
}

export type RecordItem = {
  id: number
  card_id?: number
  date_created: string
  in_product_id: number
  ex: number
  ir: number
  sir: number
  cc: number
  fr: number
  hr: number
  biggest_hit_link: string
  biggest_hit_src: string | null
  price: number
  card?: Card
}

export type RecordUpdate = Omit<RecordItem, 'id' | 'date_created'>

export type NewRecord = Omit<
  RecordRow,
  'id' | 'name' | 'total' | 'total_boosters' | 'items'
> & {
  card_id?: number
  date_created: string
  player_id: number
  set_id: number
}
