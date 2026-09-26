import {
  Button,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Menu,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
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
          <span className="brand-icon"><InsightsOutlinedIcon /></span>
          <span className="brand-title">Hit Rate</span>
        </button>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <button className={activeView === "summary" ? "active" : ""} type="button" onClick={() => onNavigate("summary")}>
            <QueryStatsOutlinedIcon /> Hall of Fame
          </button>
          <button className={activeView === "analytics" ? "active" : ""} type="button" onClick={() => onNavigate("analytics")}>
            <InsightsOutlinedIcon /> Analytics
          </button>
        </nav>
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
        <div className="header-actions">
          <Button
            variant="contained"
            onClick={() => setDialogOpen(true)}
            disabled={!canCreate}
          >
            + Add record
          </Button>
          <select className="currency-select" aria-label="display currency" value={currency} onChange={(event) => onCurrencyChange(event.target.value as Currency)}>
            <option value="EUR">EUR</option>
            <option value="HUF">HUF</option>
          </select>
          <IconButton className="mobile-menu-button" aria-label="Open navigation menu" onClick={(event) => setMenuAnchor(event.currentTarget)}>
            <MenuIcon />
          </IconButton>
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
