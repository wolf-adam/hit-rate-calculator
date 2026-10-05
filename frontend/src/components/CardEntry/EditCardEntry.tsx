import { Stack, TextField } from '@mui/material'
import type { CardDraft } from '../../types'
import './EditCardEntry.scss'

type EditCardEntryProps = {
  value: CardDraft
  onChange: (value: CardDraft) => void
}

function EditCardEntry({ value, onChange }: EditCardEntryProps) {
  function updateField(field: keyof CardDraft, fieldValue: string) {
    onChange({ ...value, [field]: fieldValue })
  }

  return (
    <Stack className="edit-card-entry" spacing={1.5}>
      <div className="edit-card-entry__row edit-card-entry__row--primary">
        <TextField
          label="Card name"
          value={value.name}
          onChange={(event) => updateField('name', event.target.value)}
          required
        />
        <TextField
          label="Price (€)"
          type="number"
          value={value.price}
          slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
          onChange={(event) => updateField('price', event.target.value)}
          required
        />
      </div>
      <div className="edit-card-entry__row edit-card-entry__row--single">
        <TextField
          label="Card link"
          value={value.link}
          onChange={(event) => updateField('link', event.target.value)}
          required
        />
      </div>
      <div className="edit-card-entry__row edit-card-entry__row--single">
        <TextField
          label="Image source"
          value={value.image_src}
          onChange={(event) => updateField('image_src', event.target.value)}
          required
        />
      </div>
    </Stack>
  )
}

export default EditCardEntry
