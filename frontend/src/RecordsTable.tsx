import {
  Chip,
  CircularProgress,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { productColors } from './constants'
import type { Currency } from './storage'
import type { ProductOption, RecordRow } from './types'

type RecordsTableProps = {
  records: RecordRow[]
  loading: boolean
  exchangeRate: number
  currency: Currency
  products: ProductOption[]
}

const columns: Array<{
    key: keyof RecordRow;
    label: string,
    className: string
}> = [
  { key: 'name', label: 'Name', className: 'name-column' },
  { key: 'total_boosters', label: 'Booster #', className: 'total_boosters-column' },
  { key: 'ex', label: 'Ex', className: 'ex-column' },
  { key: 'ir', label: 'IR', className: 'ir-column' },
  { key: 'sir', label: 'SIR', className: 'sir-column' },
  { key: 'special', label: 'Special', className: 'special-column' },
  { key: 'total', label: 'Total', className: 'total-column' },
  { key: 'biggest_hit_link', label: 'Biggest hit', className: 'biggest_hit_link-column' },
  { key: 'in_product_id', label: 'Product', className: 'in_product_id-column' },
  { key: 'price', label: 'Price', className: 'price-column' },
]

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function formatPrice(
  value: number,
  currency: Currency,
  rate: number,
): string {
  const convertedValue = currency === 'HUF' ? Math.round(value * rate) : value
  return `${formatNumber(convertedValue)} ${currency === 'HUF' ? 'Ft' : '€'}`
}

function formatBiggestHitLink(url: string): string {
  const path = url.split(/[?#]/, 1)[0]
  const lastSegment = path.split(/[\\/]/).pop() ?? url
  const decodedName = decodeURIComponent(lastSegment)
    .replace(/-V\d+(?=-|$)/i, '')
    .trim()
  const extendedCodeMatch = decodedName.match(
    /^(.+?)-(\d+[A-Za-z])([A-Za-z]*?)-?(\d{1,3})$/,
  )

  if (extendedCodeMatch) {
    const [
      , name, codePrefix, codeSuffix, codeDigits,
    ] = extendedCodeMatch
    const code = codeSuffix
      ? `${codePrefix} ${codeSuffix}`
      : codePrefix
    return `${name.replace(/-/g, ' ').trim()} (${code} ${codeDigits})`
  }

  const normalizedName = decodedName.replace(/-/g, ' ')
  const codeMatch = normalizedName.match(/^(.*?)-?([A-Za-z]+)(\d{3})$/)

  if (!codeMatch) return normalizedName

  const [, name, codeLetters, codeDigits] = codeMatch
  return `${name.trim()} (${codeLetters} ${codeDigits})`
}

function RecordsTable({
  records,
  loading,
  exchangeRate,
  currency,
  products,
}: RecordsTableProps) {
  return (
    <TableContainer className="table-wrap">
      <Table stickyHeader aria-label="hit rate records">
        <colgroup>
          {columns.map((column) => (
            <col
              key={column.key}
              className={column.className}
            />
          ))}
        </colgroup>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.key}>{column.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <CircularProgress size={26} />
              </TableCell>
            </TableRow>
          ) : records.length ? records.map((record) => {
            const productIndex = products.findIndex(
              (item) => item.id === record.in_product_id,
            )
            const product = products[productIndex]
            const productColorIndex = productIndex < 0
              ? 0
              : productIndex

            return (
              <TableRow key={record.id} hover>
                {columns.map((column) => {
                  const value = column.key === 'name'
                    ? record.name
                    : column.key === 'biggest_hit_link'
                      ? (
                        <Link
                          href={record.biggest_hit_link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {formatBiggestHitLink(
                            record.biggest_hit_link,
                          )}
                        </Link>
                      )
                      : column.key === 'in_product_id'
                        ? (
                          <Chip
                            label={
                              product?.name ?? record.in_product_id
                            }
                            color={productColors[
                              productColorIndex % productColors.length
                            ]}
                            size="small"
                          />
                        )
                        : column.key === 'price'
                          ? formatPrice(
                            record.price,
                            currency,
                            exchangeRate,
                          )
                          : formatNumber(Number(record[column.key]))

                  return (
                    <TableCell key={column.key}>{value}</TableCell>
                  )
                })}
              </TableRow>
            )
          }) : (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <Typography color="text.secondary">
                  No records for this set yet.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default RecordsTable
