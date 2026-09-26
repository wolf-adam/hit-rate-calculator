import { Fragment, useState, type ReactNode } from 'react'
import {
  Box,
  Chip,
  Collapse,
  CircularProgress,
  IconButton,
  Link,
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
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { fetchRecords } from './api'
import { availableRarities, columns, productColors } from './constants'
import type { Currency } from './storage'
import type { ProductOption, RecordItem, RecordRow, SetOption } from './types'
import { formatNumber, formatPrice, formatBiggestHitLink } from './utils'
import EditRecordDialog from './EditRecordDialog'
import './RecordsTable.scss'

type RecordsTableProps = {
  selectedSet: SetOption | undefined
  records: RecordRow[]
  loading: boolean
  exchangeRate: number
  currency: Currency
  products: ProductOption[]
  onRecordsUpdated: (records: RecordRow[]) => void
}

function BiggestHitLink({
  href,
  imageSrc,
}: {
  href: string
  imageSrc: string | null
}) {
  const label = formatBiggestHitLink(href)

  return (
    <Tooltip
      title={imageSrc ? (
        <Box
          component="img"
          className="biggest-hit-preview-image"
          src={imageSrc}
          alt={label}
        />
      ) : ''}
      placement="right"
      enterDelay={300}
      disableHoverListener={!imageSrc}
      slotProps={{ tooltip: { className: 'biggest-hit-preview' } }}
    >
      <Link href={href} target="_blank" rel="noopener noreferrer">
        {label}
      </Link>
    </Tooltip>
  )
}

const RecordsTable = ({
  selectedSet,
  records,
  loading,
  exchangeRate,
  currency,
  products,
  onRecordsUpdated,
}: RecordsTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [editingRecord, setEditingRecord] = useState<RecordItem | null>(null)
  const [sortKey, setSortKey] = useState<keyof RecordRow | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

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

    return <TableCell key={column.key}>{value}</TableCell>
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

  function renderItems(record: RecordRow) {
    return (
      <TableRow key={`items-${record.id}`}>
        <TableCell colSpan={visibleColumns.length} className="table-items-cell">
          <Collapse in={expandedRows.has(record.id)} timeout="auto" unmountOnExit>
            <Box className="table-items">
              <Table size="small" aria-label={`Individual records for ${record.name}`}>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    {rarityColumns.map((column) => (
                      <TableCell key={column.key}>{column.label}</TableCell>
                    ))}
                    <TableCell>Product</TableCell>
                    <TableCell>Biggest hit</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell aria-label="Actions" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {record.items.map((item) => {
                    const product = products.find(
                      (option) => option.id === item.in_product_id,
                    )

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          {new Date(item.date_created).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        {rarityColumns.map((column) => (
                          <TableCell key={column.key}>
                            {formatNumber(Number(item[column.key as keyof RecordItem]))}
                          </TableCell>
                        ))}
                        <TableCell>{product?.name ?? item.in_product_id}</TableCell>
                        <TableCell>
                          <BiggestHitLink
                            href={item.biggest_hit_link}
                            imageSrc={item.biggest_hit_src}
                          />
                        </TableCell>
                        <TableCell>
                          {formatPrice(item.price, currency, exchangeRate)}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit record">
                            <IconButton
                              size="small"
                              aria-label={`Edit record ${item.id}`}
                              onClick={() => setEditingRecord(item)}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    )
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
                {renderItems(record)}
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
        onSaved={async () => {
          if (selectedSet) {
            onRecordsUpdated(await fetchRecords(selectedSet.id))
          }
        }}
      />
    </TableContainer>
  )
}

export default RecordsTable
