import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { lookupCard } from '../../api'
import type { CardDraft } from '../../types'
import { formatBiggestHitLink } from '../../utils'
import './CardEntry.scss'

type CardEntryProps = {
  value: CardDraft
  onChange: (value: CardDraft) => void
}

type LookupState = 'idle' | 'loading' | 'found' | 'manual' | 'error'

function CardEntry({ value, onChange }: CardEntryProps) {
  const [lookupState, setLookupState] = useState<LookupState>('idle')
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const link = value.link.trim()
    if (!link) {
      setLookupState('idle')
      return
    }

    let cancelled = false
    setLookupState('loading')
    const timeout = window.setTimeout(() => {
      void lookupCard(link)
        .then((card) => {
          if (cancelled) return
          onChangeRef.current({
            card_id: card.id,
            name: card.name,
            link: card.link,
            image_src: card.image_src,
            price: String(card.price),
          })
          setLookupState('found')
        })
        .catch(() => {
          if (cancelled) return
          onChangeRef.current({
            ...value,
            link,
            name: value.name || formatBiggestHitLink(link),
          })
          setLookupState('manual')
        })
    }, 700)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [value.link])

  const canEditMetadata = lookupState === 'manual' || lookupState === 'error'
  const updateField = (field: keyof CardDraft, fieldValue: string) => {
    if (field === 'link') {
      onChange({
        ...value,
        card_id: undefined,
        link: fieldValue,
        name: '',
        image_src: '',
        price: '',
      })
      return
    }
    onChange({ ...value, card_id: undefined, [field]: fieldValue })
  }

  return (
    <Stack className="card-entry" spacing={1.5}>
      <TextField
        label="Card link"
        required
        value={value.link}
        onChange={(event) => updateField('link', event.target.value)}
      />
      {lookupState === 'loading' && (
        <div className="card-entry-status">
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Looking up card…
          </Typography>
        </div>
      )}
      {lookupState === 'error' && (
        <Alert severity="warning">Card lookup failed. Enter the card details manually.</Alert>
      )}
      <div className="card-entry-fields">
        <TextField
          label="Card name"
          required
          value={value.name}
          disabled={!canEditMetadata}
          slotProps={{ htmlInput: { readOnly: lookupState === 'found' } }}
          onChange={(event) => updateField('name', event.target.value)}
        />
        <TextField
          label="Image source"
          required
          value={value.image_src}
          disabled={!canEditMetadata}
          slotProps={{ htmlInput: { readOnly: lookupState === 'found' } }}
          onChange={(event) => updateField('image_src', event.target.value)}
        />
        <TextField
          label="Price (€)"
          required
          type="number"
          value={value.price}
          disabled={!canEditMetadata}
          slotProps={{
            htmlInput: { min: 0, step: 0.1, readOnly: lookupState === 'found' },
          }}
          onChange={(event) => updateField('price', event.target.value)}
        />
      </div>
    </Stack>
  )
}

export default CardEntry