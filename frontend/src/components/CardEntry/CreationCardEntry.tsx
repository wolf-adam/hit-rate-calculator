import {
  Alert,
  Autocomplete,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { Card, CardDraft } from '../../types'
import { getPkmnCardsSearchUrl } from '../../utils'
import './CreationCardEntry.scss'

type CreationCardEntryProps = {
  value: CardDraft
  onChange: (value: CardDraft) => void
  cards: Card[]
  cardsLoading: boolean
  disabled?: boolean
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase()
}

function CreationCardEntry({
  value,
  onChange,
  cards,
  cardsLoading,
  disabled = false,
}: CreationCardEntryProps) {
  const matchedCard = cards.find(
    (card) => normalizeName(card.name) === normalizeName(value.name),
  )
  const metadataDisabled = disabled || cardsLoading || Boolean(matchedCard)

  function updateField(field: keyof CardDraft, fieldValue: string) {
    if (field === 'name') {
      const card = cards.find(
        (option) => normalizeName(option.name) === normalizeName(fieldValue),
      )
      onChange(card
        ? {
          card_id: card.id,
          name: card.name,
          link: card.link,
          image_src: card.image_src,
          price: String(card.price),
        }
        : {
          ...value,
          card_id: undefined,
          name: fieldValue,
          link: '',
          image_src: '',
          price: '',
        })
      return
    }
    onChange({ ...value, card_id: undefined, [field]: fieldValue })
  }

  return (
    <Stack className="creation-card-entry" spacing={1.5}>
      <Autocomplete
        freeSolo
        options={cards}
        value={matchedCard ?? null}
        inputValue={value.name}
        disabled={disabled || cardsLoading}
        getOptionLabel={(option) => (
          typeof option === 'string' ? option : option.name
        )}
        filterOptions={(options, state) => {
          const query = normalizeName(state.inputValue)
          return options.filter((option) => normalizeName(option.name).includes(query))
        }}
        isOptionEqualToValue={(option, selected) => option.id === selected.id}
        onInputChange={(_, inputValue, reason) => {
          if (reason === 'input') updateField('name', inputValue)
          if (reason === 'clear') updateField('name', '')
        }}
        onChange={(_, selected) => {
          if (!selected) {
            updateField('name', '')
            return
          }
          if (typeof selected === 'string') {
            updateField('name', selected)
            return
          }
          onChange({
            card_id: selected.id,
            name: selected.name,
            link: selected.link,
            image_src: selected.image_src,
            price: String(selected.price),
          })
        }}
        noOptionsText="No matching cards"
        renderInput={(params) => (
          <TextField {...params} label="Card name" />
        )}
      />
      {cardsLoading && (
        <div className="creation-card-entry__status">
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Loading saved cards...
          </Typography>
        </div>
      )}
      {!cardsLoading && value.name && !matchedCard && (
        <Alert severity="info">
          Card not found. Enter the link, image source, and price manually.
        </Alert>
      )}
      <div className="creation-card-entry__fields">
        <TextField
          label="Card link"
          value={value.link}
          disabled={metadataDisabled}
          onChange={(event) => updateField('link', event.target.value)}
          helperText={value.name ? (
            <span>Find card image on
              <Link
                href={getPkmnCardsSearchUrl(value.name)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {' pkmncards.com'}
              </Link>
            </span>
          ) : undefined}
        />
        <TextField
          label="Image source"
          value={value.image_src}
          disabled={metadataDisabled}
          onChange={(event) => updateField('image_src', event.target.value)}
        />
        <TextField
          label="Price (€)"
          type="number"
          value={value.price}
          disabled={metadataDisabled}
          slotProps={{ htmlInput: { min: 0, step: 0.1 } }}
          onChange={(event) => updateField('price', event.target.value)}
        />
      </div>
    </Stack>
  )
}

export default CreationCardEntry
