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
import { createCard, updateCard, updateRecord } from './api'
import type {
  CardDraft,
  ProductOption,
  RecordItem,
  RecordUpdate,
} from './types'
import ProductSelect from './components/ProductSelect/ProductSelect'
import CardEntry from './components/CardEntry/CardEntry'
import { formatBiggestHitLink } from './utils'
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
  card: CardDraft
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
    card: {
      card_id: record.card_id,
      name: record.card?.name ?? formatBiggestHitLink(record.biggest_hit_link),
      link: record.card?.link ?? record.biggest_hit_link,
      image_src: record.card?.image_src ?? record.biggest_hit_src ?? '',
      price: String(record.card?.price ?? record.price),
    },
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

  function updateCardDraft(card: CardDraft) {
    setForm((current) => current ? { ...current, card } : current)
  }

  async function handleSave() {
    if (!record || !form) return

    setSaving(true)
    setError('')

    try {
      const card = form.card.card_id
        ? await updateCard(form.card.card_id, {
          name: form.card.name,
          link: form.card.link,
          image_src: form.card.image_src,
          price: Number(form.card.price),
        })
        : await createCard({
          name: form.card.name,
          link: form.card.link,
          image_src: form.card.image_src,
          price: Number(form.card.price),
        })
      const payload: RecordUpdate = {
        card_id: card.id,
        in_product_id: Number(form.in_product_id),
        ex: Number(form.ex),
        ir: Number(form.ir),
        sir: Number(form.sir),
        cc: Number(form.cc),
        fr: Number(form.fr),
        hr: Number(form.hr),
        biggest_hit_link: card.link,
        biggest_hit_src: card.image_src,
        price: card.price,
      }
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
            <CardEntry
              value={form?.card ?? {
                name: '',
                link: '',
                image_src: '',
                price: '',
              }}
              onChange={updateCardDraft}
            />
          </div>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => void handleSave()}
          disabled={saving || !form?.in_product_id || !form.card.link
            || !form.card.name || !form.card.image_src || !form.card.price}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditRecordDialog