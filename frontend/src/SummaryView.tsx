import {
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material'
import RecordsTable from './RecordsTable'
import type { Currency } from './storage'
import type {
  ProductOption,
  RecordRow,
  SetOption,
} from './types'

type SummaryViewProps = {
  selectedSet: SetOption | undefined
  currency: Currency
  exchangeRate: number | null
  records: RecordRow[]
  loading: boolean
  products: ProductOption[]
  onRecordsUpdated: (records: RecordRow[]) => void
}

function SummaryView({
  selectedSet,
  currency,
  exchangeRate,
  records,
  loading,
  products,
  onRecordsUpdated,
}: SummaryViewProps) {
  return (
    <Paper className="content-panel" elevation={0}>
      {exchangeRate === null ? (
        <div className="table-state">
          <CircularProgress size={26} />
          <Typography color="text.secondary">
            Loading exchange rate…
          </Typography>
        </div>
      ) : (
        <RecordsTable
          selectedSet={selectedSet}
          records={records}
          loading={loading}
          exchangeRate={exchangeRate}
          currency={currency}
          products={products}
          onRecordsUpdated={onRecordsUpdated}
        />
      )}
    </Paper>
  )
}

export default SummaryView
