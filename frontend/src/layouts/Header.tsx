import { useState } from "react";
import {
  Button,
  IconButton,
  MenuItem,
  Select,
  Menu,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import type { Currency } from "../data/storage";
import type { SetOption } from "../types";
import "./Header.scss";

type HeaderProps = {
  sets: SetOption[];
  selectedSetId: number | "";
  currency: Currency;
  players: { id: number; name: string }[];
  products: { id: number; name: string }[];
  onAddUser: () => void;
  onSignOut: () => void | Promise<void>;
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
  onAddUser,
  onSignOut,
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
          <Typography className="collection-eyebrow">
            Active collection
          </Typography>
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
        <div className="header-actions">
          {activeView === "summary" && (
            <div className="creation-actions">
              <Button
                className="add-user-button"
                variant="outlined"
                startIcon={<PersonAddAlt1OutlinedIcon />}
                onClick={onAddUser}
              >
                Add user
              </Button>
              <Button
                className="add-record-button"
                variant="contained"
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => setDialogOpen(true)}
                disabled={!canCreate}
              >
                Add record
              </Button>
            </div>
          )}
          {activeView === "summary" && (
            <Button
              className="currency-toggle-button"
              variant="outlined"
              startIcon={<SwapHorizIcon />}
              onClick={() => onCurrencyChange(currency === "EUR" ? "HUF" : "EUR")}
              aria-label={`Switch display currency to ${currency === "EUR" ? "HUF" : "EUR"}`}
              title={`Switch to ${currency === "EUR" ? "HUF" : "EUR"}`}
            >
              {currency}
            </Button>
          )}
          <Button
            className="sign-out-button"
            variant="outlined"
            startIcon={<LogoutOutlinedIcon />}
            onClick={() => void onSignOut()}
          >
            Sign out
          </Button>
        </div>
      </div>
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { onNavigate("summary"); setMenuAnchor(null); }}>Hall of Fame</MenuItem>
        <MenuItem onClick={() => { onNavigate("analytics"); setMenuAnchor(null); }}>Analytics</MenuItem>
      </Menu>
    </header>
  );
}

export default Header;
