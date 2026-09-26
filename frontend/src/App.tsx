import { useEffect, useState } from "react";
import { Alert, Tab, Tabs } from "@mui/material";
import {
  fetchEurToHufRate,
  fetchPlayers,
  fetchProducts,
  fetchRecords,
  fetchSets,
} from "./api";
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
} from "./storage";
import type { Currency } from "./storage";
import type {
  PlayerOption,
  ProductOption,
  RecordRow,
  SetOption,
} from "./types";
import { TAB_NAMES } from "./constants";
import SummaryView from "./SummaryView";
import AnalyticsView from "./AnalyticsView";
import Dialog from "./Dialog";
import Header from "./Header";
import "./App.scss";

function App() {
  const [currency, setCurrency] = useState<Currency>(() => readCurrency());
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [sets, setSets] = useState<SetOption[]>(() => readCachedSets());
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>(() =>
    readCachedProducts(),
  );
  const [selectedSetId, setSelectedSetId] = useState<number | "">(
    () => readSelectedSet() ?? "",
  );
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState(TAB_NAMES.SUMMARY);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  function handleSetChange(setId: number) {
    setSelectedSetId(setId);
    writeSelectedSet(setId);
  }

  const selectedSet = sets.find((set) => set.id === selectedSetId);

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
      />

      {error && (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Tabs
        value={activeView}
        onChange={(_, nextView: string) => setActiveView(nextView)}
        aria-label="calculator views"
      >
        {Object.values(TAB_NAMES).map((tabName) => (
          <Tab key={tabName} value={tabName} label={tabName} />
        ))}
      </Tabs>

      {activeView === TAB_NAMES.SUMMARY ? (
        <SummaryView
          selectedSet={selectedSet}
          currency={currency}
          exchangeRate={exchangeRate}
          records={records}
          loading={loading}
          products={products}
          onRecordsUpdated={setRecords}
        />
      ) : (
        <AnalyticsView />
      )}
      {selectedSetId && (
        <Dialog
          open={dialogOpen}
          setId={selectedSetId}
          players={players}
          products={products}
          onClose={() => setDialogOpen(false)}
          onRecordsUpdated={setRecords}
          onError={setError}
        />
      )}
    </main>
  );
}

export default App;
