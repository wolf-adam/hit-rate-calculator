import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  Alert,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import {
  fetchEurToHufRate,
  fetchCards,
  fetchPlayers,
  fetchProductAnalytics,
  fetchProducts,
  fetchRecords,
  fetchSets,
} from "../data/api";
import {
  readCachedExchangeRate,
  readCachedProducts,
  readCachedSets,
  readCurrency,
  readSelectedSet,
  writeCachedExchangeRate,
  writeCachedProducts,
  writeCachedSets,
  writeCurrency,
  writeSelectedSet,
} from "../data/storage";
import type { Currency } from "../data/storage";
import type {
  PlayerOption,
  ProductOption,
  RecordRow,
  ProductAnalytics,
  Card,
  SetOption,
} from "../types";
import {
  authClient,
  isAuthConfigured,
  NEON_AUTH_SESSION_VERIFIER_PARAM_NAME,
} from "../auth/client";
import SummaryView from "../SummaryView/SummaryView";
import AnalyticsView from "../AnalyticsView/AnalyticsView";
import RecordCreationDialog from "../components/dialogs/RecordCreationDialog";
import UserCreationDialog from "../components/dialogs/UserCreationDialog";
import Header from "../layouts/Header";
import "./App.scss";

type AppView = "summary" | "analytics";

function getViewFromPath(pathname: string): AppView {
  return pathname === "/analytics" ? "analytics" : "summary";
}

function App() {
  if (!isAuthConfigured) {
    return (
      <main className="auth-page">
        <Alert severity="warning" variant="outlined">
          Neon Auth is not configured. Enable Neon Auth with Google in Neon, then
          set <code>VITE_NEON_AUTH_URL</code> to its Auth Base URL.
        </Alert>
      </main>
    );
  }

  return (
    <BrowserRouter>
      <AuthProviderShell />
    </BrowserRouter>
  );
}

function AuthProviderShell() {
  return (
    <Routes>
      <Route path="/sign-in" element={<AuthPage />} />
      <Route path="/sign-up" element={<Navigate to="/sign-in" replace />} />
      <Route
        path="*"
        element={(
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        )}
      />
    </Routes>
  );
}

function AuthPage() {
  const [searchParams] = useSearchParams();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState("");
  const requestedRedirect = searchParams.get("redirectTo");
  const redirectTo = requestedRedirect?.startsWith("/") &&
    !requestedRedirect.startsWith("//")
    ? requestedRedirect
    : "/";

  async function signInWithGoogle() {
    setIsSigningIn(true);
    setError("");
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectTo,
      });
      if (result.error) {
        setError(result.error.message ?? "Google sign-in could not be started.");
      } else if (result.data?.url) {
        window.location.assign(result.data.url);
      }
    } catch {
      setError("Google sign-in could not be started.");
    } finally {
      setIsSigningIn(false);
    }
  }

  if (session) return <Navigate to={redirectTo} replace />;

  return (
    <main className="auth-page">
      <Paper className="auth-card" elevation={0}>
        <Typography className="auth-brand">HIT RATE CALCULATOR</Typography>
        <Typography variant="h6" gutterBottom>Sign in</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <Button
          fullWidth
          variant="contained"
          disabled={isPending || isSigningIn}
          onClick={() => void signInWithGoogle()}
        >
          {isPending || isSigningIn
            ? <CircularProgress size={20} color="inherit" />
            : "Continue with Google"}
        </Button>
      </Paper>
    </main>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const location = useLocation();

  useEffect(() => {
    const callbackUrl = new URL(window.location.href);
    if (!session || !callbackUrl.searchParams.has(NEON_AUTH_SESSION_VERIFIER_PARAM_NAME)) {
      return;
    }
    callbackUrl.searchParams.delete(NEON_AUTH_SESSION_VERIFIER_PARAM_NAME);
    window.history.replaceState(
      window.history.state,
      "",
      `${callbackUrl.pathname}${callbackUrl.search}${callbackUrl.hash}`,
    );
  }, [location.search, session]);

  if (isPending) {
    return (
      <main className="auth-page">
        <CircularProgress aria-label="Checking sign-in" />
      </main>
    );
  }
  if (!session) {
    const redirectTo = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to={`/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`}
        replace
      />
    );
  }
  return <>{children}</>;
}

function AppShell() {
  const [toast, setToast] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>(() => readCurrency());
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [sets, setSets] = useState<SetOption[]>(() => readCachedSets());
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>(() =>
    readCachedProducts(),
  );
  const [cards, setCards] = useState<Card[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [selectedSetId, setSelectedSetId] = useState<number | "">(
    () => readSelectedSet() ?? "",
  );
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [recordsRefreshKey, setRecordsRefreshKey] = useState(0);
  const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics[]>([]);
  const [productAnalyticsLoading, setProductAnalyticsLoading] = useState(false);
  const [productAnalyticsError, setProductAnalyticsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const activeView = getViewFromPath(location.pathname);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);

  useEffect(() => {
    async function loadCards() {
      try {
        setCards(await fetchCards());
      } catch {
        setError("Could not load cards.");
      } finally {
        setCardsLoading(false);
      }
    }
    void loadCards();
  }, []);

  useEffect(() => {
    async function loadPlayers() {
      try {
        setPlayers(await fetchPlayers());
      } catch {
        setError("Could not load players.");
      }
    }
    void loadPlayers();
  }, []);

  useEffect(() => {
    async function loadProducts() {
      const cachedProducts = readCachedProducts();
      if (cachedProducts.length) {
        setProducts(cachedProducts);
        return;
      }
      try {
        const availableProducts = await fetchProducts();
        setProducts(availableProducts);
        writeCachedProducts(availableProducts);
      } catch {
        setError("Could not load products.");
      }
    }
    void loadProducts();
  }, []);

  useEffect(() => {
    async function loadExchangeRate() {
      const cached = readCachedExchangeRate();
      const cacheIsFresh =
        cached && Date.now() - cached.fetchedAt < 60 * 60 * 1000;

      if (cacheIsFresh) {
        setExchangeRate(cached.rate);
        return;
      }

      try {
        const rate = await fetchEurToHufRate();
        setExchangeRate(rate);
        writeCachedExchangeRate(rate);
      } catch {
        setError("Could not load the EUR to HUF exchange rate.");
      }
    }
    void loadExchangeRate();

    const refreshTimer = window.setInterval(
      () => {
        void loadExchangeRate();
      },
      60 * 60 * 1000,
    );

    return () => window.clearInterval(refreshTimer);
  }, []);

  useEffect(() => {
    async function loadSets() {
      try {
        const availableSets = await fetchSets();
        writeCachedSets(availableSets);
        setSets(availableSets);
        const cachedSelection = readSelectedSet();
        const nextSetId = availableSets.some(
          (set) => set.id === cachedSelection,
        )
          ? cachedSelection!
          : (availableSets[0]?.id ?? "");
        setSelectedSetId(nextSetId);
        if (nextSetId) writeSelectedSet(nextSetId);
      } catch {
        setError("Could not load sets. Check that the API is running.");
      }
    }
    void loadSets();
  }, []);

  useEffect(() => {
    if (!selectedSetId) {
      setRecords([]);
      setLoading(false);
      return;
    }
    const setId = selectedSetId;

    async function loadRecords() {
      setLoading(true);
      setError("");
      try {
        setRecords(await fetchRecords(setId));
      } catch {
        setError("Could not load records for this set.");
      } finally {
        setLoading(false);
      }
    }
    void loadRecords();
  }, [selectedSetId]);

  useEffect(() => {
    if (!selectedSetId) {
      setProductAnalytics([]);
      return;
    }
    const setId = selectedSetId;

    async function loadProductAnalytics() {
      setProductAnalyticsLoading(true);
      setProductAnalyticsError("");
      try {
        setProductAnalytics(await fetchProductAnalytics(setId));
      } catch {
        setProductAnalytics([]);
        setProductAnalyticsError("Could not load product analytics.");
      } finally {
        setProductAnalyticsLoading(false);
      }
    }
    void loadProductAnalytics();
  }, [selectedSetId, recordsRefreshKey]);

  function handleSetChange(setId: number) {
    setSelectedSetId(setId);
    writeSelectedSet(setId);
  }

  const handleRecordsUpdated = useCallback((nextRecords: RecordRow[]) => {
    setRecords(nextRecords);
    setRecordsRefreshKey((current) => current + 1);
  }, []);

  const selectedSet = sets.find((set) => set.id === selectedSetId);

  const notify = useCallback((message: string, severity: "success" | "error") => {
    setToast({ message, severity });
    setToastOpen(true);
  }, []);

  const handleCreationError = useCallback(
    (message: string) => notify(message, "error"),
    [notify],
  );

  function navigateTo(view: AppView) {
    const path = view === "analytics" ? "/analytics" : "/";
    navigate(path);
  }

  return (
    <main className="app-shell">
      <Header
        sets={sets}
        selectedSetId={selectedSetId}
        currency={currency}
        players={players}
        products={products}
        onAddUser={() => setUserDialogOpen(true)}
        onSignOut={async () => {
          const result = await authClient.signOut();
          if (!result.error) navigate("/sign-in", { replace: true });
        }}
        setDialogOpen={setDialogOpen}
        onSetChange={handleSetChange}
        onCurrencyChange={(nextCurrency) => {
          setCurrency(nextCurrency);
          writeCurrency(nextCurrency);
        }}
        activeView={activeView}
        onNavigate={navigateTo}
      />

      {error && (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {activeView === "summary" ? (
        <SummaryView
          selectedSet={selectedSet}
          currency={currency}
          exchangeRate={exchangeRate}
          records={records}
          loading={loading}
          products={products}
          cards={cards}
          cardsLoading={cardsLoading}
          onRecordsUpdated={handleRecordsUpdated}
          onNotify={notify}
        />
      ) : (
        <AnalyticsView
          selectedSet={selectedSet}
          records={records}
          loading={loading}
          productAnalytics={productAnalytics}
          productAnalyticsLoading={productAnalyticsLoading}
          productAnalyticsError={productAnalyticsError}
        />
      )}
      {selectedSet && (
        <RecordCreationDialog
          open={dialogOpen}
          set={selectedSet}
          players={players}
          products={products}
          cards={cards}
          cardsLoading={cardsLoading}
          onClose={() => setDialogOpen(false)}
          onRecordsUpdated={handleRecordsUpdated}
          onError={handleCreationError}
          onSuccess={(message) => notify(message, "success")}
        />
      )}
      <UserCreationDialog
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        onCreated={(player) => {
          setPlayers((current) => [...current, player].sort((a, b) =>
            a.name.localeCompare(b.name),
          ));
          setUserDialogOpen(false);
          notify(`${player.name} added successfully.`, "success");
        }}
      />
      {toast && (
        <Snackbar
          open={toastOpen}
          autoHideDuration={4000}
          onClose={() => setToastOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={toast.severity}
            onClose={() => setToastOpen(false)}
            variant="filled"
          >
            {toast.message}
          </Alert>
        </Snackbar>
      )}
    </main>
  );
}

export default App;
