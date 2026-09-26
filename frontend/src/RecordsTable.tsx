import { Fragment, useState, type ReactNode } from 'react'
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { fetchRecords } from './api'
import { availableRarities, columns, productColors } from './constants'
import type { Currency } from './storage'
import type { ProductOption, RecordItem, RecordRow, SetOption } from './types'
import { formatNumber, formatPrice, formatBiggestHitLink } from './utils'
import EditRecordDialog from './EditRecordDialog'
import BiggestHitLink from './BiggestHitLink'
import RecordItemsTable from './RecordItemsTable'
import './RecordsTable.scss'

type RecordsTableProps = {
  selectedSet: SetOption | undefined
  records: RecordRow[]
  loading: boolean
  exchangeRate: number
  currency: Currency
  products: ProductOption[]
  onRecordsUpdated: (records: RecordRow[]) => void
  onNotify: (message: string, severity: 'success' | 'error') => void
}

const RecordsTable = ({
  selectedSet,
  records,
  loading,
  exchangeRate,
  currency,
  products,
  onRecordsUpdated,
  onNotify,
}: RecordsTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [editingRecord, setEditingRecord] = useState<RecordItem | null>(null)
  const [sortKey, setSortKey] = useState<keyof RecordRow | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  async function refreshRecordsAfterModification() {
    if (!selectedSet) return
    const refreshedRecords = await fetchRecords(selectedSet.id)
    onRecordsUpdated(refreshedRecords)
  }

  const visibleColumns = columns.filter((column) => {
    switch (column.key) {
      case 'ex':
      case 'ir':
      case 'sir':
      case 'cc':
      case 'fr':
      case 'hr':
        return (selectedSet?.[column.key] ?? 0) > 0
      default:
        return true
    }
  })

  const getCells = (
    record: RecordRow,
    product: ProductOption | undefined,
    productColorIndex: number,
    expanded: boolean,
  ) => visibleColumns.map((column) => {
      let value: ReactNode

      switch (column.key) {
        case 'name':
          value = (
            <Box className="table-player-name">
              <IconButton
                size="small"
                aria-label={`${expanded ? 'Collapse' : 'Expand'} records for ${record.name}`}
                onClick={() => setExpandedRows((current) => {
                  const next = new Set(current)
                  if (next.has(record.id)) next.delete(record.id)
                  else next.add(record.id)
                  return next
                })}
              >
                {expanded
                  ? <KeyboardArrowDownIcon />
                  : <KeyboardArrowRightIcon />}
              </IconButton>
              {record.name}
            </Box>
          )
          break
        case 'biggest_hit_link':
          value = (
            <BiggestHitLink
              href={record.biggest_hit_link}
              imageSrc={record.biggest_hit_src}
            />
          )
          break
        case 'in_product_id':
          value = (
            <Chip
              label={product?.name ?? record.in_product_id}
              color={productColors[
                productColorIndex % productColors.length
              ]}
              size="small"
            />
          )
          break
        case 'price':
          value = formatPrice(record.price, currency, exchangeRate)
          break
        default:
          value = formatNumber(Number(record[column.key]))
      }

    return (
      <TableCell
        key={column.key}
        align={column.key === 'total_boosters' ? 'center' : undefined}
        className={column.key === 'in_product_id'
          ? 'product-chip-cell'
          : column.key === 'total_boosters' ? 'booster-count-cell' : undefined}
      >
        {value}
      </TableCell>
    )
  })

  const rarityColumns = visibleColumns.filter((column) =>
    availableRarities.includes(column.key),
  )

  const activeSortKey = sortKey
  const sortedRecords = activeSortKey === null ? records : [...records].sort((left, right) => {
    let comparison: number

    switch (activeSortKey) {
      case 'name':
        comparison = left.name.localeCompare(right.name)
        break
      case 'biggest_hit_link':
        comparison = formatBiggestHitLink(left.biggest_hit_link).localeCompare(
          formatBiggestHitLink(right.biggest_hit_link),
        )
        break
      case 'in_product_id': {
        const leftProduct = products.find(
          (product) => product.id === left.in_product_id,
        )?.name ?? String(left.in_product_id)
        const rightProduct = products.find(
          (product) => product.id === right.in_product_id,
        )?.name ?? String(right.in_product_id)
        comparison = leftProduct.localeCompare(rightProduct)
        break
      }
      default:
        comparison = Number(left[activeSortKey]) - Number(right[activeSortKey])
    }

    return comparison * (sortDirection === 'asc' ? 1 : -1)
  })

  function handleSort(columnKey: keyof RecordRow) {
    if (sortKey === columnKey) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc')
      return
    }

    setSortKey(columnKey)
    setSortDirection(columnKey === 'name' || columnKey === 'biggest_hit_link' || columnKey === 'in_product_id'
      ? 'asc'
      : 'desc')
  }

  return (
    <TableContainer className="table-wrap">
      {sortKey !== null && (
        <Box className="table-sort-reset">
          <Tooltip title="Clear sorting">
            <IconButton
              size="small"
              aria-label="Clear sorting and restore default order"
              onClick={() => setSortKey(null)}
            >
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      <Table stickyHeader aria-label="hit rate records">
        <colgroup>
          {visibleColumns.map((column) => (
            <col
              key={column.key}
              className={column.className}
            />
          ))}
        </colgroup>
        <TableHead>
          <TableRow>
            {visibleColumns.map((column) => (
              <TableCell
                key={column.key}
                align={column.key === 'total_boosters' ? 'center' : undefined}
                className={column.key === 'in_product_id'
                  ? 'product-column-header'
                  : column.key === 'total_boosters' ? 'booster-count-cell' : undefined}
                sortDirection={sortKey === column.key ? sortDirection : false}
              >
                <TableSortLabel
                  active={sortKey === column.key}
                  direction={sortKey === column.key ? sortDirection : 'asc'}
                  onClick={() => handleSort(column.key)}
                >
                  {column.label}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={visibleColumns.length} align="center">
                <CircularProgress size={26} />
              </TableCell>
            </TableRow>
          ) : sortedRecords.length ? sortedRecords.map((record) => {
            const productIndex = products.findIndex(
              (item) => item.id === record.in_product_id,
            )
            const product = products[productIndex]
            const productColorIndex = productIndex < 0
              ? 0
              : productIndex

            return (
              <Fragment key={record.id}>
                <TableRow hover>
                  {getCells(
                    record,
                    product,
                    productColorIndex,
                    expandedRows.has(record.id),
                  )}
                </TableRow>
                <RecordItemsTable
                  record={record}
                  expanded={expandedRows.has(record.id)}
                  colSpan={visibleColumns.length}
                  rarityColumns={rarityColumns}
                  products={products}
                  currency={currency}
                  exchangeRate={exchangeRate}
                  onEdit={setEditingRecord}
                />
              </Fragment>
            )
          }) : (
            <TableRow>
              <TableCell colSpan={visibleColumns.length} align="center">
                <Typography color="text.secondary">
                  No records for this set yet.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <EditRecordDialog
        record={editingRecord}
        products={products}
        onClose={() => setEditingRecord(null)}
        onError={(message) => onNotify(message, 'error')}
        onSuccess={(message) => onNotify(message, 'success')}
        onSaved={refreshRecordsAfterModification}
      />
    </TableContainer>
  )
}

export default RecordsTable
