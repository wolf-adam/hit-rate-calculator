import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
} from '@mui/material'
import { useState } from 'react'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { columns, productColors } from '../config/constants'
import type { Currency } from '../data/storage'
import type { ProductOption, RecordItem, RecordRow } from '../types'
import { formatNumber, formatPrice, formatBiggestHitLink } from '../utils/formatting'
import BiggestHitLink from './BiggestHitLink'
import './RecordItemsTable.scss'

type RecordColumn = (typeof columns)[number]
type ItemSortKey =
  | 'date_created'
  | 'ex'
  | 'ir'
  | 'sir'
  | 'cc'
  | 'fr'
  | 'hr'
  | 'in_product_id'
  | 'biggest_hit_link'
  | 'price'

type RecordItemsTableProps = {
  record: RecordRow
  expanded: boolean
  colSpan: number
  rarityColumns: RecordColumn[]
  products: ProductOption[]
  currency: Currency
  exchangeRate: number
  onEdit: (record: RecordItem) => void
}

function RecordItemsTable({
  record,
  expanded,
  colSpan,
  rarityColumns,
  products,
  currency,
  exchangeRate,
  onEdit,
}: RecordItemsTableProps) {
  const [sortKey, setSortKey] = useState<ItemSortKey>('date_created')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(5)

  function handleSort(columnKey: ItemSortKey) {
    if (sortKey === columnKey) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc')
      setPage(0)
      return
    }

    setSortKey(columnKey)
    setPage(0)
    setSortDirection(columnKey === 'date_created'
      || columnKey === 'in_product_id'
      || columnKey === 'biggest_hit_link'
      ? 'asc'
      : 'desc')
  }

  const sortedItems = sortKey === null ? record.items : [...record.items].sort((left, right) => {
    let comparison: number

    switch (sortKey) {
      case 'date_created':
        comparison = new Date(left.date_created).getTime()
          - new Date(right.date_created).getTime()
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
      case 'biggest_hit_link':
        comparison = formatBiggestHitLink(left.biggest_hit_link).localeCompare(
          formatBiggestHitLink(right.biggest_hit_link),
        )
        break
      default:
        comparison = Number(left[sortKey]) - Number(right[sortKey])
    }

    return comparison * (sortDirection === 'asc' ? 1 : -1)
  })

  const paginatedItems = sortedItems.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  )

  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="table-items-cell">
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box className="table-items">
            <Table size="small" aria-label={`Individual records for ${record.name}`}>
              <colgroup>
                <col className="date-column" />
                {rarityColumns.map((column) => (
                  <col key={column.key} className={`${column.key}-column`} />
                ))}
                <col className="product-column" />
                <col className="biggest-hit-column" />
                <col className="price-column" />
                <col className="actions-column" />
              </colgroup>
              <TableHead>
                <TableRow>
                  <TableCell sortDirection={sortKey === 'date_created' ? sortDirection : false}>
                    <TableSortLabel
                      active={sortKey === 'date_created'}
                      direction={sortKey === 'date_created' ? sortDirection : 'asc'}
                      onClick={() => handleSort('date_created')}
                    >
                      Date
                    </TableSortLabel>
                  </TableCell>
                  {rarityColumns.map((column) => (
                    <TableCell
                      key={column.key}
                      sortDirection={sortKey === column.key ? sortDirection : false}
                    >
                      <TableSortLabel
                        active={sortKey === column.key}
                        direction={sortKey === column.key ? sortDirection : 'asc'}
                        onClick={() => handleSort(column.key as ItemSortKey)}
                      >
                        {column.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                  <TableCell
                    className="product-column-header"
                    sortDirection={sortKey === 'in_product_id' ? sortDirection : false}
                  >
                    <TableSortLabel
                      active={sortKey === 'in_product_id'}
                      direction={sortKey === 'in_product_id' ? sortDirection : 'asc'}
                      onClick={() => handleSort('in_product_id')}
                    >
                      Product
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={sortKey === 'biggest_hit_link' ? sortDirection : false}>
                    <TableSortLabel
                      active={sortKey === 'biggest_hit_link'}
                      direction={sortKey === 'biggest_hit_link' ? sortDirection : 'asc'}
                      onClick={() => handleSort('biggest_hit_link')}
                    >
                      Biggest hit
                    </TableSortLabel>
                  </TableCell>
                  <TableCell
                    align="right"
                    sortDirection={sortKey === 'price' ? sortDirection : false}
                  >
                    <TableSortLabel
                      active={sortKey === 'price'}
                      direction={sortKey === 'price' ? sortDirection : 'asc'}
                      onClick={() => handleSort('price')}
                    >
                      Price
                    </TableSortLabel>
                  </TableCell>
                  <TableCell aria-label="Actions" />
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedItems.map((item) => {
                  const product = products.find(
                    (option) => option.id === item.in_product_id,
                  )
                  const productIndex = products.findIndex(
                    (option) => option.id === item.in_product_id,
                  )

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        {new Date(item.date_created).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      {rarityColumns.map((column) => (
                        <TableCell key={column.key}>
                          {formatNumber(Number(item[column.key as keyof RecordItem]))}
                        </TableCell>
                      ))}
                      <TableCell className="product-chip-cell">
                        <Chip
                          label={product?.name ?? item.in_product_id}
                          color={productColors[
                            (productIndex < 0 ? 0 : productIndex) % productColors.length
                          ]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <BiggestHitLink
                          href={item.biggest_hit_link}
                          imageSrc={item.biggest_hit_src}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {formatPrice(item.price, currency, exchangeRate)}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit record">
                          <IconButton
                            size="small"
                            aria-label={`Edit record ${item.id}`}
                            onClick={() => onEdit(item)}
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
            <TablePagination
              component="div"
              count={sortedItems.length}
              page={page}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(Number(event.target.value))
                setPage(0)
              }}
              rowsPerPageOptions={[5, 10, 15]}
            />
          </Box>
        </Collapse>
      </TableCell>
    </TableRow>
  )
}

export default RecordItemsTable