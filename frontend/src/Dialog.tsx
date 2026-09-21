import { useState } from 'react'
import {
  Button,
  Chip,
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
import { createRecord, fetchRecords } from './api'
import { productColors } from './constants'
import type { PlayerOption, ProductOption, RecordRow } from './types'

type DialogProps = {
  open: boolean
  setId: number
  players: PlayerOption[]
  products: ProductOption[]
  onClose: () => void
  onRecordsUpdated: (records: RecordRow[]) => void
  onError: (message: string) => void
}

type RecordForm = {
  in_product_id: number
  ex: string
  ir: string
  sir: string
  special: string
  biggest_hit_link: string
  price: string
}

const emptyRecord: RecordForm = {
  in_product_id: 0,
  ex: '',
  ir: '',
  sir: '',
  special: '',
  biggest_hit_link: '',
  price: '',
}

const fields = [
    { key: 'ex', label: 'Ex', type: 'number' },
    { key: 'ir', label: 'IR', type: 'number' },
    { key: 'sir', label: 'SIR', type: 'number' },
    { key: 'special', label: 'Special', type: 'number' },
    { key: 'biggest_hit_link', label: "Biggest hit's link", type: 'text' },
    { key: 'price', label: 'Price (€)', type: 'number' },
] as const

function DialogComponent({
  open,
  setId,
  players,
  products,
  onClose,
  onRecordsUpdated,
  onError,
}: DialogProps) {
  const [playerId, setPlayerId] = useState(0)
  const [records, setRecords] = useState<RecordForm[]>([emptyRecord])
  const [saving, setSaving] = useState(false)

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
    onError('')
    try {
      await Promise.all(records.map((record) => createRecord({
        ...record,
        ex: Number(record.ex),
        ir: Number(record.ir),
        sir: Number(record.sir),
        special: Number(record.special),
        price: Number(record.price),
        date_created: new Date().toISOString(),
        player_id: playerId,
        set_id: setId,
      })))
      onRecordsUpdated(await fetchRecords(setId))
      resetForm()
      onClose()
    } catch {
      onError('Could not save all records.')
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
          <Button
            variant="outlined"
              onClick={() => setRecords((current) => [
                ...current,
                emptyRecord,
              ])}
            disabled={saving}
          >
            Add another record
          </Button>
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
                <Select
                    aria-label={`select product for record ${index + 1}`}
                    value={record.in_product_id || ''}
                    onChange={(event) => 
                        updateRecord(
                            index,
                            'in_product_id',
                            String(event.target.value),
                    )}
                    displayEmpty
                    fullWidth
                >
                    <MenuItem value="" disabled>Select product</MenuItem>
                    {products.map((product, productIndex) => (
                    <MenuItem key={product.id} value={product.id}>
                        <Chip
                        label={product.name}
                        color={productColors[
                            productIndex % productColors.length
                        ]}
                        size="small"
                        />
                    </MenuItem>
                    ))}
                </Select>
              <div className="record-form">
                {fields.map((field) => (
                  <TextField
                    key={field.key}
                    label={field.label}
                    type={field.type}
                    slotProps={field.type === 'number'
                      ? {
                        htmlInput: {
                          min: 0,
                          step: field.key === 'price' ? 0.1 : 1,
                        },
                      }
                      : undefined}
                    value={record[field.key]}
                    onChange={(event) => updateRecord(
                      index,
                      field.key,
                      event.target.value,
                    )}
                  />
                ))}
              </div>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={saving || !playerId || records.some(
            (record) => !record.in_product_id,
          )}
        >
          {saving ? 'Saving…' : `Save ${records.length} record${records.length === 1 ? '' : 's'}`}
        </Button>
      </DialogActions>
    </MuiDialog>
  )
}

export default DialogComponent
