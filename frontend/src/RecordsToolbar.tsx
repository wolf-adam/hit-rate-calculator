import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import type { Currency } from './storage'
import type { SetOption } from './types'

type RecordsToolbarProps = {
  sets: SetOption[]
  selectedSetId: number | ''
  currency: Currency
  onSetChange: (setId: number) => void
  onCurrencyChange: (currency: Currency) => void
}

function RecordsToolbar({
  sets,
  selectedSetId,
  currency,
  onSetChange,
  onCurrencyChange,
}: RecordsToolbarProps) {
  return (
    <Stack
      className="toolbar"
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ sm: 'center' }}
      justifyContent="space-between"
      spacing={2}
    >
      <div>
        <Typography variant="h6">Records</Typography>
        <Typography variant="body2" color="text.secondary">
          Select a set to review its current results.
        </Typography>
      </div>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="set-select-label">Set</InputLabel>
          <Select
            labelId="set-select-label"
            value={selectedSetId}
            label="Set"
            onChange={(event) =>
              onSetChange(Number(event.target.value))
            }
          >
            {sets.map((set) => (
              <MenuItem key={set.id} value={set.id}>
                {set.long_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={currency}
          onChange={(_, nextCurrency: Currency | null) => {
            if (nextCurrency) onCurrencyChange(nextCurrency)
          }}
          onClick={(event) => {
            event.stopPropagation()
            onCurrencyChange(currency === 'EUR' ? 'HUF' : 'EUR')
          }}
          aria-label="display currency"
        >
          <ToggleButton value="EUR" aria-label="show prices in euro">
            EUR
          </ToggleButton>
          <ToggleButton
            value="HUF"
            aria-label="show prices in Hungarian forint"
          >
            HUF
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </Stack>
  )
}

export default RecordsToolbar
