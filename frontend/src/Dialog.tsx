import { type CSSProperties, useEffect, useState } from 'react'
import {
  Button,
  CircularProgress,
  Dialog as MuiDialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  createCard,
  createRecord,
  fetchRecordsForModal,
  getApiErrorMessage,
} from './api'
import type {
  CardDraft,
  Card,
  PlayerOption,
  ProductOption,
  RecordRow,
  SetOption,
} from './types'
import ProductSelect from './components/ProductSelect/ProductSelect'
import CardEntry from './components/CardEntry/CardEntry'
import './Dialog.scss'

type DialogProps = {
  open: boolean
  set: SetOption
  players: PlayerOption[]
  products: ProductOption[]
  cards: Card[]
  cardsLoading: boolean
  onClose: () => void
  onRecordsUpdated: (records: RecordRow[]) => void
  onError: (message: string) => void
  onSuccess: (message: string) => void
}

type RecordForm = {
  in_product_id: number
  ex: string
  ir: string
  sir: string
  cc: string
  fr: string
  hr: string
  card: CardDraft
}

const emptyRecord: RecordForm = {
  in_product_id: 0,
  ex: '',
  ir: '',
  sir: '',
  cc: '',
  fr: '',
  hr: '',
  card: {
    name: '',
    link: '',
    image_src: '',
    price: '',
  },
}

const rarityFields = [
    { key: 'ex', label: 'Ex', type: 'number' },
    { key: 'ir', label: 'IR', type: 'number' },
    { key: 'sir', label: 'SIR', type: 'number' },
    { key: 'cc', label: 'CC', type: 'number' },
    { key: 'fr', label: 'FR', type: 'number' },
    { key: 'hr', label: 'HR', type: 'number' },
] as const

function DialogComponent({
  open,
  set,
  players,
  products,
  cards,
  cardsLoading,
  onClose,
  onRecordsUpdated,
  onError,
  onSuccess,
}: DialogProps) {
  const fields = rarityFields.filter((field) => (set[field.key] ?? 0) > 0)
  const [playerId, setPlayerId] = useState(0)
  const [records, setRecords] = useState<RecordForm[]>([emptyRecord])
  const [saving, setSaving] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setModalLoading(true)
    void fetchRecordsForModal(set.id)
      .then((latestRecords) => {
        if (!cancelled) onRecordsUpdated(latestRecords)
      })
      .catch(() => {
        if (!cancelled) onError('Could not refresh records before creating.')
      })
      .finally(() => {
        if (!cancelled) setModalLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, set.id])

  function updateRecord(
    index: number,
    field: keyof RecordForm,
    value: string,
  ) {
    setRecords((current) => current.map((record, recordIndex) => (
      recordIndex === index
        ? {
          ...record,
          [field]: field === 'in_product_id' ? Number(value) : value,
        }
        : record
    )))
  }

  function updateCard(index: number, card: CardDraft) {
    setRecords((current) => current.map((record, recordIndex) => (
      recordIndex === index ? { ...record, card } : record
    )))
  }

  function resetForm() {
    setPlayerId(0)
    setRecords([emptyRecord])
  }

  function closeDialog() {
    if (!saving) {
      resetForm()
      onClose()
    }
  }

  async function handleSubmit() {
    if (!playerId || records.some(
      (record) => !record.in_product_id,
    )) return
    setSaving(true)
    try {
      await Promise.all(records.map(async (record) => {
        const cardId = record.card.card_id ?? (await createCard({
          name: record.card.name,
          link: record.card.link,
          image_src: record.card.image_src,
          price: Number(record.card.price),
        })).id
        return createRecord({
          card_id: cardId,
          biggest_hit_link: record.card.link,
          biggest_hit_src: record.card.image_src,
          ex: Number(record.ex),
          ir: Number(record.ir),
          sir: Number(record.sir),
          cc: Number(record.cc),
          fr: Number(record.fr),
          hr: Number(record.hr),
          price: Number(record.card.price),
          date_created: new Date().toISOString(),
          player_id: playerId,
          set_id: set.id,
          in_product_id: record.in_product_id,
        })
      }))
      onRecordsUpdated(await fetchRecordsForModal(set.id))
      onSuccess('Records created successfully.')
      resetForm()
      onClose()
    } catch (error) {
      onError(getApiErrorMessage(error, 'Could not save all records.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <MuiDialog
      open={open}
      onClose={closeDialog}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>Add records</DialogTitle>
      <DialogContent>
        <Stack className="record-batch" spacing={2}>
          <Select
            aria-label="select player"
            value={playerId || ''}
            disabled={modalLoading || saving}
              onChange={(event) =>
                setPlayerId(Number(event.target.value))
              }
            displayEmpty
            fullWidth
          >
            <MenuItem value="" disabled>Select player</MenuItem>
            {players.map((player) => (
              <MenuItem key={player.id} value={player.id}>
                {player.name}
              </MenuItem>
            ))}
          </Select>
          {modalLoading && (
            <div className="card-entry-status">
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Loading current records before opening the entry form...
              </Typography>
            </div>
          )}
          {records.map((record, index) => (
            <Stack className="record-item" key={index} spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle2">
                  Record {index + 1}
                </Typography>
                <IconButton
                  aria-label={`remove record ${index + 1}`}
                    onClick={() => {
                      setRecords((current) => current.filter(
                        (_, recordIndex) => recordIndex !== index,
                      ))
                    }}
                  disabled={records.length === 1 || saving}
                  size="small"
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Stack>
              <div
                className="record-form"
                style={{
                  '--product-columns': 15 - fields.length * 2,
                } as CSSProperties}
              >
                <ProductSelect
                  className="record-field record-field--product"
                  aria-label={`select product for record ${index + 1}`}
                  value={record.in_product_id || ''}
                  onChange={(value) => updateRecord(
                    index,
                    'in_product_id',
                    value,
                  )}
                  products={products}
                  disabled={modalLoading || cardsLoading || saving}
                />
                {fields.map((field) => (
                  <TextField
                    key={field.key}
                    className={`record-field record-field--${field.key}`}
                    label={field.label}
                    type={field.type}
                    slotProps={{ htmlInput: { min: 0, step: 1 } }}
                    disabled={modalLoading || cardsLoading || saving}
                    value={record[field.key]}
                    onChange={(event) => updateRecord(
                      index,
                      field.key,
                      event.target.value,
                    )}
                  />
                ))}
                <CardEntry
                  value={record.card}
                  lockMetadata
                  cards={cards}
                  cardsLoading={cardsLoading}
                  disabled={modalLoading || cardsLoading || saving}
                  onChange={(card) => updateCard(index, card)}
                />
              </div>
            </Stack>
          ))}

          <Button
            variant="outlined"
              onClick={() => setRecords((current) => [
                ...current,
                emptyRecord,
              ])}
            disabled={modalLoading || saving}
          >
            Add another record
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog} disabled={modalLoading || saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={modalLoading || saving || !playerId || records.some((record) => (
            !record.in_product_id
            || !record.card.link
            || !record.card.name
            || !record.card.image_src
            || !record.card.price
          ))}
        >
          {saving ? 'Saving…' : `Save ${records.length} record${records.length === 1 ? '' : 's'}`}
        </Button>
      </DialogActions>
    </MuiDialog>
  )
}

export default DialogComponent
