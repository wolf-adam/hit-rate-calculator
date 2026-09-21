export type SetOption = {
  id: number
  short_name: string
  long_name: string
}

export type PlayerOption = {
  id: number
  name: string
}

export type ProductOption = {
  id: number
  name: string
}

export type RecordRow = {
  id: number
  name: string
  ex: number
  ir: number
  sir: number
  special: number
  total: number
  biggest_hit_link: string
  in_product_id: number
  price: number
  total_boosters: number
}

export type NewRecord = Omit<
  RecordRow,
  'id' | 'name' | 'total' | 'total_boosters'
> & {
  date_created: string
  player_id: number
  set_id: number
}
