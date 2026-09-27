import {
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import { buildAnalyticsData } from "./analytics";
import type { ProductAnalytics, RecordRow, SetOption } from "./types";
import "./AnalyticsView.scss";
import AnalyticsKpis from "./AnalyticsView/AnalyticsKpis/AnalyticsKpis";
import DistributionPanel from "./AnalyticsView/DistributionPanel/DistributionPanel";
import ExpectedRates from "./AnalyticsView/ExpectedRates/ExpectedRates";
import ProductComparison from "./AnalyticsView/ProductComparison/ProductComparison";

type AnalyticsViewProps = {
  selectedSet?: SetOption;
  records: RecordRow[];
  loading: boolean;
  productAnalytics: ProductAnalytics[];
  productAnalyticsLoading: boolean;
  productAnalyticsError: string;
};

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function AnalyticsView({
  selectedSet,
  records,
  loading,
  productAnalytics,
  productAnalyticsLoading,
  productAnalyticsError,
}: AnalyticsViewProps) {
  const data = buildAnalyticsData(records, selectedSet);

  if (loading) {
    return (
      <Paper className="analytics-state content-panel" elevation={0}>
        <CircularProgress size={28} />
        <Typography color="text.secondary">Loading analytics…</Typography>
      </Paper>
    );
  }

  const hitVsNoHit = [
    {
      key: "hit",
      label: "At least one hit",
      color: "#45a354",
      count: data.totalHits,
      observedRate: data.hitRate,
      expectedRate: null,
    },
    data.rarities.find((item) => item.key === "noHit")!,
  ];

  return (
    <section className="analytics-view" aria-label="Analytics dashboard">
      <AnalyticsKpis
        items={[
          {
            label: "Total boosters opened",
            value: data.totalBoosters.toLocaleString(),
            detail: "Across all players",
            icon: "□",
          },
          {
            label: "Total hits",
            value: data.totalHits.toLocaleString(),
            detail: `${formatPercent(data.hitRate)} hit rate`,
            icon: "◈",
          },
          {
            label: "Premium hits",
            tooltip: "Premium hits include SIR, FR, HR, and CC rarities.",
            value: data.premiumHits.toLocaleString(),
            detail: `${formatPercent(data.totalBoosters ? (data.premiumHits / data.totalBoosters) * 100 : 0)} of boosters`,
            icon: "✦",
          },
          {
            label: "1 in X boosters",
            value: data.oneInX ? `1 in ${data.oneInX.toFixed(2)}` : "-",
            detail: "For any hit",
            icon: "▱",
          },
          {
            label: "No-hit rate",
            value: formatPercent(data.noHitRate),
            detail: `${data.noHitBoosters.toLocaleString()} no-hit boosters`,
            icon: "⊘",
          },
        ]}
      />

      <div className="analytics-feature-grid">
        <DistributionPanel rarities={data.rarities} outcomes={hitVsNoHit} />
        <ExpectedRates rarities={data.rarities} />
      </div>

      <ProductComparison
        rarities={data.rarities}
        products={productAnalytics}
        loading={productAnalyticsLoading}
        error={productAnalyticsError}
      />
    </section>
  );
}

export default AnalyticsView;
