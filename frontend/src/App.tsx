import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material'
import {
  fetchEurToHufRate,
  fetchPlayers,
  fetchProducts,
  fetchRecords,
  fetchSets,
} from './api'
import {
  readCachedExchangeRate,
  readCachedProducts,
  readCachedSets,
  readCurrency,
  readSelectedSet,
  writeCachedExchangeRate,
  writeCachedProducts,
  writeCachedSets,
  writeCurrency,
  writeSelectedSet,
} from './storage'
import type { Currency } from './storage'
import type {
  PlayerOption,
  ProductOption,
  RecordRow,
  SetOption,
} from './types'
import Dialog from './Dialog'
import RecordsTable from './RecordsTable'
import RecordsToolbar from './RecordsToolbar'

function App() {
  const [currency, setCurrency] = useState<Currency>(
    () => readCurrency(),
  )
  const [exchangeRate, setExchangeRate] = useState<number | null>(
    null,
  )
  const [sets, setSets] = useState<SetOption[]>(
    () => readCachedSets(),
  )
  const [players, setPlayers] = useState<PlayerOption[]>([])
  const [products, setProducts] = useState<ProductOption[]>(
    () => readCachedProducts(),
  )
  const [selectedSetId, setSelectedSetId] = useState<number | ''>(
    () => readSelectedSet() ?? '',
  )
  const [records, setRecords] = useState<RecordRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    async function loadPlayers() {
      try {
        setPlayers(await fetchPlayers())
      } catch {
        setError('Could not load players.')
      }
    }
    void loadPlayers()
  }, [])

  useEffect(() => {
    async function loadProducts() {
      const cachedProducts = readCachedProducts()
      if (cachedProducts.length) {
        setProducts(cachedProducts)
        return
      }
      try {
        const availableProducts = await fetchProducts()
        setProducts(availableProducts)
        writeCachedProducts(availableProducts)
      } catch {
        setError('Could not load products.')
      }
    }
    void loadProducts()
  }, [])

  useEffect(() => {
    async function loadExchangeRate() {
      const cached = readCachedExchangeRate()
      const cacheIsFresh =
        cached && Date.now() - cached.fetchedAt < 60 * 60 * 1000

      if (cacheIsFresh) {
        setExchangeRate(cached.rate)
        return
      }

      try {
        const rate = await fetchEurToHufRate()
        setExchangeRate(rate)
        writeCachedExchangeRate(rate)
      } catch {
        setError('Could not load the EUR to HUF exchange rate.')
      }
    }
    void loadExchangeRate()

    const refreshTimer = window.setInterval(() => {
      void loadExchangeRate()
    }, 60 * 60 * 1000)

    return () => window.clearInterval(refreshTimer)
  }, [])

  useEffect(() => {
    async function loadSets() {
      try {
        const cachedSets = readCachedSets()
        const availableSets = cachedSets.length
          ? cachedSets
          : await fetchSets()
        if (!cachedSets.length) writeCachedSets(availableSets)
        setSets(availableSets)
        const cachedSelection = readSelectedSet()
        const nextSetId = availableSets.some(
          (set) => set.id === cachedSelection,
        )
          ? cachedSelection!
          : availableSets[0]?.id ?? ''
        setSelectedSetId(nextSetId)
        if (nextSetId) writeSelectedSet(nextSetId)
      } catch {
        setError('Could not load sets. Check that the API is running.')
      }
    }
    void loadSets()
  }, [])

  useEffect(() => {
    if (!selectedSetId) {
      setRecords([])
      setLoading(false)
      return
    }
    const setId = selectedSetId

    async function loadRecords() {
      setLoading(true)
      setError('')
      try {
        setRecords(await fetchRecords(setId))
      } catch {
        setError('Could not load records for this set.')
      } finally {
        setLoading(false)
      }
    }
    void loadRecords()
  }, [selectedSetId])

  function handleSetChange(setId: number) {
    setSelectedSetId(setId)
    writeSelectedSet(setId)
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <Typography className="eyebrow">COLLECTION ANALYTICS</Typography>
          <Typography component="h1" variant="h3">Hit rate calculator</Typography>
          <Typography className="subtitle">Compare set performance at a glance.</Typography>
        </div>
        <Button
          variant="contained"
          onClick={() => setDialogOpen(true)}
          disabled={
            !selectedSetId || !players.length || !products.length
          }
        >
          Add record
        </Button>
      </header>

      {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

      <Paper className="content-panel" elevation={0}>
        <RecordsToolbar
          sets={sets}
          selectedSetId={selectedSetId}
          currency={currency}
          onSetChange={handleSetChange}
          onCurrencyChange={(nextCurrency) => {
            setCurrency(nextCurrency)
            writeCurrency(nextCurrency)
          }}
        />

        {exchangeRate === null ? (
          <div className="table-state">
            <CircularProgress size={26} />
            <Typography color="text.secondary">Loading exchange rate…</Typography>
          </div>
        ) : (
          <RecordsTable
            records={records}
            loading={loading}
            exchangeRate={exchangeRate}
            currency={currency}
            products={products}
          />
        )}
      </Paper>

      {selectedSetId && (
        <Dialog
          open={dialogOpen}
          setId={selectedSetId}
          players={players}
          products={products}
          onClose={() => setDialogOpen(false)}
          onRecordsUpdated={setRecords}
          onError={setError}
        />
      )}
    </main>
  )
}

export default App
