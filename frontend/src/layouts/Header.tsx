import { useState } from "react";
import {
  Button,
  IconButton,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Menu,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
import type { Currency } from "../data/storage";
import type { SetOption } from "../types";
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
  activeView: "summary" | "analytics";
  onNavigate: (view: "summary" | "analytics") => void;
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
  activeView,
  onNavigate,
}: HeaderProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const canCreate = Boolean(selectedSetId && players.length && products.length);

  return (
    <header className="page-header">
      <div className="header-toolbar">
        <button className="brand-mark" type="button" onClick={() => onNavigate("summary")}>
          <span className="brand-icon">
            <img src="/favicon.svg" alt="" />
          </span>
          <span className="brand-title">Hit Rate Calculator</span>
        </button>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <button className={activeView === "summary" ? "active" : ""} type="button" onClick={() => onNavigate("summary")}>
            <QueryStatsOutlinedIcon /> Hall of Fame
          </button>
          <button className={activeView === "analytics" ? "active" : ""} type="button" onClick={() => onNavigate("analytics")}>
            <InsightsOutlinedIcon /> Analytics
          </button>
        </nav>
        <IconButton className="mobile-menu-button" aria-label="Open navigation menu" onClick={(event) => setMenuAnchor(event.currentTarget)}>
          <MenuIcon />
        </IconButton>
      </div>
      <div className="header-controls">
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
        {activeView === "summary" && (
          <div className="header-actions">
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
              <ToggleButton value="EUR" aria-label="EUR">EUR</ToggleButton>
              <ToggleButton value="HUF" aria-label="HUF">HUF</ToggleButton>
            </ToggleButtonGroup>
          </div>
        )}
      </div>
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { onNavigate("summary"); setMenuAnchor(null); }}>Hall of Fame</MenuItem>
        <MenuItem onClick={() => { onNavigate("analytics"); setMenuAnchor(null); }}>Analytics</MenuItem>
      </Menu>
    </header>
  );
}

export default Header;
