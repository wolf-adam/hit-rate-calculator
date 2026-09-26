import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { lookupCard } from '../../api'
import type { CardDraft } from '../../types'
import { formatBiggestHitLink, getPkmnCardsSearchUrl } from '../../utils'
import './CardEntry.scss'

type CardEntryProps = {
  value: CardDraft
  onChange: (value: CardDraft) => void
  lockMetadata?: boolean
}

type LookupState = 'idle' | 'loading' | 'found' | 'manual' | 'error'

function CardEntry({ value, onChange, lockMetadata = false }: CardEntryProps) {
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
  const metadataDisabled = lockMetadata && !canEditMetadata
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
    onChange({ ...value, [field]: fieldValue })
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
          disabled={metadataDisabled}
          slotProps={{ htmlInput: { readOnly: lockMetadata && lookupState === 'found' } }}
          onChange={(event) => updateField('name', event.target.value)}
        />
        <TextField
          label="Image source"
          required
          helperText={value.link ? (
            <Link
              href={getPkmnCardsSearchUrl(value.link)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Find card image on pkmncards.com
            </Link>
          ) : undefined}
          value={value.image_src}
          disabled={metadataDisabled}
          slotProps={{ htmlInput: { readOnly: lockMetadata && lookupState === 'found' } }}
          onChange={(event) => updateField('image_src', event.target.value)}
        />
        <TextField
          label="Price (€)"
          required
          type="number"
          value={value.price}
          disabled={metadataDisabled}
          slotProps={{
            htmlInput: {
              min: 0,
              step: 0.1,
              readOnly: lockMetadata && lookupState === 'found',
            },
          }}
          onChange={(event) => updateField('price', event.target.value)}
        />
      </div>
    </Stack>
  )
}

export default CardEntry