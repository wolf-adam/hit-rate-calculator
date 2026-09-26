import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import { updateRecord } from './api'
import type { ProductOption, RecordItem, RecordUpdate } from './types'
import ProductSelect from './components/ProductSelect/ProductSelect'
import './EditRecordDialog.scss'

type EditRecordDialogProps = {
  record: RecordItem | null
  products: ProductOption[]
  onClose: () => void
  onSaved: () => Promise<void>
}

type RecordForm = {
  in_product_id: string
  ex: string
  ir: string
  sir: string
  cc: string
  fr: string
  hr: string
  biggest_hit_link: string
  biggest_hit_src: string
  price: string
}

const rarityFields = [
  { key: 'ex', label: 'EX' },
  { key: 'ir', label: 'IR' },
  { key: 'sir', label: 'SIR' },
  { key: 'cc', label: 'CC' },
  { key: 'fr', label: 'FR' },
  { key: 'hr', label: 'HR' },
] as const

function toForm(record: RecordItem): RecordForm {
  return {
    in_product_id: String(record.in_product_id),
    ex: String(record.ex),
    ir: String(record.ir),
    sir: String(record.sir),
    cc: String(record.cc),
    fr: String(record.fr),
    hr: String(record.hr),
    biggest_hit_link: record.biggest_hit_link,
    biggest_hit_src: record.biggest_hit_src ?? '',
    price: String(record.price),
  }
}

function EditRecordDialog({
  record,
  products,
  onClose,
  onSaved,
}: EditRecordDialogProps) {
  const [form, setForm] = useState<RecordForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(record ? toForm(record) : null)
    setError('')
  }, [record])

  function updateField(field: keyof RecordForm, value: string) {
    setForm((current) => current ? { ...current, [field]: value } : current)
  }

  async function handleSave() {
    if (!record || !form) return

    setSaving(true)
    setError('')
    const payload: RecordUpdate = {
      in_product_id: Number(form.in_product_id),
      ex: Number(form.ex),
      ir: Number(form.ir),
      sir: Number(form.sir),
      cc: Number(form.cc),
      fr: Number(form.fr),
      hr: Number(form.hr),
      biggest_hit_link: form.biggest_hit_link,
      biggest_hit_src: form.biggest_hit_src || null,
      price: Number(form.price),
    }

    try {
      await updateRecord(record.id, payload)
      await onSaved()
      onClose()
    } catch {
      setError('Could not update this record.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      className="edit-record-dialog"
      open={Boolean(record)}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Edit record</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <ProductSelect
            onChange={(value) => updateField('in_product_id', value)}
            products={products}
            aria-label="record product"
            value={form?.in_product_id ?? ''}
            fullWidth
          />
          <div className="record-form">
            {rarityFields.map((field) => (
              <TextField
                key={field.key}
                className={`record-field record-field--${field.key}`}
                label={field.label}
                type="number"
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
                value={form?.[field.key] ?? ''}
                onChange={(event) => updateField(field.key, event.target.value)}
              />
            ))}
            <TextField
              className="record-field record-field--biggest_hit_link"
              label="Biggest hit's link"
              value={form?.biggest_hit_link ?? ''}
              onChange={(event) => updateField('biggest_hit_link', event.target.value)}
            />
            <TextField
              className="record-field record-field--biggest_hit_src"
              label="Biggest hit's image URL"
              value={form?.biggest_hit_src ?? ''}
              onChange={(event) => updateField('biggest_hit_src', event.target.value)}
            />
            <TextField
              className="record-field record-field--price"
              label="Price (€)"
              type="number"
              slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
              value={form?.price ?? ''}
              onChange={(event) => updateField('price', event.target.value)}
            />
          </div>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => void handleSave()}
          disabled={saving || !form?.in_product_id || !form.biggest_hit_link}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditRecordDialog