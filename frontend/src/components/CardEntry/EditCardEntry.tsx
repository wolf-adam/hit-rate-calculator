import type { Card, CardDraft } from '../../types'
import CreationCardEntry from './CreationCardEntry'
import './EditCardEntry.scss'

type EditCardEntryProps = {
  value: CardDraft
  onChange: (value: CardDraft) => void
  cards: Card[]
  cardsLoading: boolean
  disabled?: boolean
}

function EditCardEntry({
  value,
  onChange,
  cards,
  cardsLoading,
  disabled = false,
}: EditCardEntryProps) {
  return (
    <div className="edit-card-entry">
      <CreationCardEntry
        value={value}
        onChange={onChange}
        cards={cards}
        cardsLoading={cardsLoading}
        disabled={disabled}
        allowMatchedCardMetadataEdit
      />
    </div>
  )
}

export default EditCardEntry
