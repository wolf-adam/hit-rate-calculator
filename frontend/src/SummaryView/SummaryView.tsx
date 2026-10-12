import {
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material'
import RecordsTable from './RecordsTable'
import type { Currency } from '../data/storage'
import type {
  Card,
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
  cards: Card[]
  cardsLoading: boolean
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
  cards,
  cardsLoading,
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
          cards={cards}
          cardsLoading={cardsLoading}
          onRecordsUpdated={onRecordsUpdated}
          onNotify={onNotify}
        />
      )}
    </Paper>
  )
}

export default SummaryView
