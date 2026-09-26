import {
  Box,
  Collapse,
  IconButton,
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { columns } from './constants'
import type { Currency } from './storage'
import type { ProductOption, RecordItem, RecordRow } from './types'
import { formatNumber, formatPrice, formatBiggestHitLink } from './utils'
import BiggestHitLink from './BiggestHitLink'

type RecordColumn = (typeof columns)[number]

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
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="table-items-cell">
        <Collapse in={expanded} timeout="auto" unmountOnExit>
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
          </Box>
        </Collapse>
      </TableCell>
    </TableRow>
  )
}

export default RecordItemsTable