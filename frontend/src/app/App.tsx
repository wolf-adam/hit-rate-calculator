import { useEffect, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
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
import SummaryView from "../SummaryView/SummaryView";
import AnalyticsView from "../AnalyticsView/AnalyticsView";
import RecordCreationDialog from "../components/dialogs/RecordCreationDialog";
import Header from "../layouts/Header";
import "./App.scss";

type AppView = "summary" | "analytics";

function getViewFromPath(pathname: string): AppView {
  return pathname === "/analytics" ? "analytics" : "summary";
}

function App() {
  const [toast, setToast] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);
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
  const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics[]>([]);
  const [productAnalyticsLoading, setProductAnalyticsLoading] = useState(false);
  const [productAnalyticsError, setProductAnalyticsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState<AppView>(() =>
    getViewFromPath(window.location.pathname),
  );
  const [dialogOpen, setDialogOpen] = useState(false);

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
  }, [selectedSetId]);

  function handleSetChange(setId: number) {
    setSelectedSetId(setId);
    writeSelectedSet(setId);
  }

  const selectedSet = sets.find((set) => set.id === selectedSetId);

  function notify(message: string, severity: "success" | "error") {
    setToast({ message, severity });
  }

  function navigateTo(view: AppView) {
    const path = view === "analytics" ? "/analytics" : "/";
    window.history.pushState({}, "", path);
    setActiveView(view);
  }

  useEffect(() => {
    const handlePopState = () => {
      setActiveView(getViewFromPath(window.location.pathname));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <main className="app-shell">
      <Header
        sets={sets}
        selectedSetId={selectedSetId}
        currency={currency}
        players={players}
        products={products}
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
          onRecordsUpdated={setRecords}
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
          onRecordsUpdated={setRecords}
          onError={(message) => notify(message, "error")}
          onSuccess={(message) => notify(message, "success")}
        />
      )}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast?.severity ?? "success"}
          onClose={() => setToast(null)}
          variant="filled"
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </main>
  );
}

export default App;
