import {
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material'
import RecordsTable from './RecordsTable'
import type { Currency } from '../data/storage'
import type {
  ProductOption,
  RecordRow,
  SetOption,
} from '../types'

type SummaryViewProps = {
  selectedSet: SetOption | undefined
  currency: Currency
  exchangeRate: number | null
  records: RecordRow[]
  loading: boolean
  products: ProductOption[]
  onRecordsUpdated: (records: RecordRow[]) => void
  onNotify: (message: string, severity: 'success' | 'error') => void
}

function SummaryView({
  selectedSet,
  currency,
  exchangeRate,
  records,
  loading,
  products,
  onRecordsUpdated,
  onNotify,
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
          onNotify={onNotify}
        />
      )}
    </Paper>
  )
}

export default SummaryView
