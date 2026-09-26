import {
  Button,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import type { Currency } from "./storage";
import type { SetOption } from "./types";
import "./Header.scss";

type HeaderProps = {
  sets: SetOption[];
  selectedSetId: number | "";
  currency: Currency;
  players: { id: number; name: string }[];
  products: { id: number; name: string }[];
  setDialogOpen: (open: boolean) => void;
  onSetChange: (setId: number) => void;
  onCurrencyChange: (currency: Currency) => void;
};

function Header({
  sets,
  selectedSetId,
  currency,
  players,
  products,
  setDialogOpen,
  onSetChange,
  onCurrencyChange,
}: HeaderProps) {
  const canCreate = Boolean(selectedSetId && players.length && products.length);

  const currencyOptions = [
    { key: "EUR", "aria-label": "EUR" },
    { key: "HUF", "aria-label": "HUF" },
  ];

  return (
    <header className="page-header">
      <Stack
        className="header-toolbar"
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
      >
        <div className="header-copy">
          <Select
            labelId="set-select-label"
            value={selectedSetId}
            onChange={(event) => onSetChange(Number(event.target.value))}
          >
            {sets.map((set) => (
              <MenuItem key={set.id} value={set.id}>
                {set.long_name}
              </MenuItem>
            ))}
          </Select>
          <Typography variant="body2" color="text.secondary">
            Turn your openings into meaningful insights.
          </Typography>
        </div>
        <Stack
          className="header-actions"
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
        >
          <Button
            variant="contained"
            onClick={() => setDialogOpen(true)}
            disabled={!canCreate}
          >
            + Add record
          </Button>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={currency}
            onChange={(_, nextCurrency: Currency | null) => {
              if (nextCurrency) onCurrencyChange(nextCurrency);
            }}
            onClick={(event) => {
              event.stopPropagation();
              onCurrencyChange(currency === "EUR" ? "HUF" : "EUR");
            }}
            aria-label="display currency"
          >
            {currencyOptions.map((option) => (
              <ToggleButton
                key={option.key}
                value={option.key}
                aria-label={option["aria-label"]}
              >
                {option.key}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      </Stack>
    </header>
  );
}

export default Header;
