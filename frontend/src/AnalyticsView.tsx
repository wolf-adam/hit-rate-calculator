import {
  Alert,
  CircularProgress,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { buildAnalyticsData, type AnalyticsData } from "./analytics";
import { columns } from "./constants";
import type { ProductAnalytics, RecordRow, SetOption } from "./types";
import "./AnalyticsView.scss";

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

function DonutChart({
  data,
  centerLabel,
}: {
  data: AnalyticsData["rarities"];
  centerLabel: string;
}) {
  const visible = data.filter((item) => item.count > 0);
  const total = visible.reduce((sum, item) => sum + item.count, 0);
  let offset = 0;

  return (
    <div className="analytics-donut-wrap">
      <svg
        className="analytics-donut"
        viewBox="0 0 120 120"
        role="img"
        aria-label={`${centerLabel} distribution`}
      >
        <circle className="analytics-donut__track" cx="60" cy="60" r="42" />
        {total > 0 &&
          visible.map((item) => {
            const length = (item.count / total) * 263.9;
            const segment = (
              <circle
                key={item.key}
                className="analytics-donut__segment"
                cx="60"
                cy="60"
                r="42"
                stroke={item.color}
                strokeDasharray={`${length} ${263.9 - length}`}
                strokeDashoffset={-offset}
              />
            );
            offset += length;
            return segment;
          })}
      </svg>
      <div className="analytics-donut__center">
        <strong>{centerLabel}</strong>
        <span>boosters</span>
      </div>
    </div>
  );
}

function DistributionLegend({ data }: { data: AnalyticsData["rarities"] }) {
  return (
    <div className="analytics-legend">
      <div className="analytics-legend__header">
        <span>Rarity</span>
        <span>Count</span>
        <span>Rate</span>
      </div>
      {data.map((item) => (
        <div className="analytics-legend__row" key={item.key}>
          <span className="analytics-legend__label">
            <i style={{ backgroundColor: item.color }} />
            {columns.find((column) => column.key === item.key)?.fullName ?? item.label}
          </span>
          <span>{item.count.toLocaleString()}</span>
          <span>{formatPercent(item.observedRate)}</span>
        </div>
      ))}
    </div>
  );
}

function Kpi({
  label,
  value,
  detail,
  icon,
  tooltip,
}: {
  label: string;
  value: string;
  detail: string;
  icon: string;
  tooltip?: string;
}) {
  return (
    <div className="analytics-kpi">
      <span className="analytics-kpi__icon">{icon}</span>
      <div>
        <span className="analytics-kpi__label">
          {tooltip ? (
            <Tooltip title={tooltip} arrow placement="top">
              <span className="analytics-kpi__label--help">{label} ⓘ</span>
            </Tooltip>
          ) : (
            label
          )}
        </span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
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
      <Paper className="analytics-kpis content-panel" elevation={0}>
        <Kpi
          label="Total boosters opened"
          value={data.totalBoosters.toLocaleString()}
          detail="Across all players"
          icon="□"
        />
        <Kpi
          label="Total hits"
          value={data.totalHits.toLocaleString()}
          detail={`${formatPercent(data.hitRate)} hit rate`}
          icon="◈"
        />
        <Kpi
          label="Premium hits"
          tooltip="Premium hits include SIR, FR, HR, and CC rarities."
          value={data.premiumHits.toLocaleString()}
          detail={`${formatPercent(data.totalBoosters ? (data.premiumHits / data.totalBoosters) * 100 : 0)} of boosters`}
          icon="✦"
        />
        <Kpi
          label="1 in X boosters"
          value={data.oneInX ? `1 in ${data.oneInX.toFixed(2)}` : "-"}
          detail="For any hit"
          icon="▱"
        />
        <Kpi
          label="No-hit rate"
          value={formatPercent(data.noHitRate)}
          detail={`${data.noHitBoosters.toLocaleString()} no-hit boosters`}
          icon="⊘"
        />
      </Paper>

      <div className="analytics-chart-grid">
        <Paper className="analytics-panel content-panel" elevation={0}>
          <Typography variant="h6">Pull distribution</Typography>
          <Typography className="analytics-panel__subtitle">
            Share of all opened boosters by rarity.
          </Typography>
          <div className="analytics-chart-content">
            <DonutChart
              data={data.rarities}
              centerLabel={data.totalBoosters.toLocaleString()}
            />
            <DistributionLegend data={data.rarities} />
          </div>
        </Paper>
        <Paper className="analytics-panel content-panel" elevation={0}>
          <Typography variant="h6">Hit vs no-hit boosters</Typography>
          <Typography className="analytics-panel__subtitle">
            Proportion of boosters with at least one recorded hit.
          </Typography>
          <div className="analytics-chart-content">
            <DonutChart
              data={hitVsNoHit}
              centerLabel={data.totalBoosters.toLocaleString()}
            />
            <DistributionLegend data={hitVsNoHit} />
          </div>
        </Paper>
      </div>

      <Paper
        className="analytics-panel analytics-rates content-panel"
        elevation={0}
      >
        <Typography variant="h6">Expected vs observed rates</Typography>
        <Typography className="analytics-panel__subtitle">
          Compare your results to the published rates for this set.
        </Typography>
        <div className="analytics-source-banner">
          <span className="analytics-source-banner__icon">i</span>
          <div>
            <strong>About the expected rates</strong>
            <span>
              Expected values come from the selected set’s published pull-rate
              data. The exact source values and link will be added here.
            </span>
          </div>
        </div>
        <div className="analytics-rates-list">
          {data.rarities
            .filter((item) => item.key !== "noHit")
            .map((item) => {
              const difference =
                item.expectedRate === null
                  ? null
                  : item.observedRate - item.expectedRate;
              const observedWidth = Math.min(100, item.observedRate);
              const expectedWidth = Math.min(100, item.expectedRate ?? 0);
              return (
                <div className="analytics-rate-row" key={item.key}>
                  <div className="analytics-rate-row__label">
                    <i style={{ backgroundColor: item.color }} />
                    <strong>{columns.find((column) => column.key === item.key)?.fullName ?? item.label}</strong>
                    <span>{item.count.toLocaleString()} hits</span>
                  </div>
                  <div className="analytics-rate-row__measure">
                    <div>
                      <span>Observed</span>
                      <b>{formatPercent(item.observedRate)}</b>
                    </div>
                    <span className="analytics-rate-row__track">
                      <i
                        style={{
                          width: `${observedWidth}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </span>
                  </div>
                  <div className="analytics-rate-row__measure">
                    <div>
                      <span>Expected</span>
                      <b>
                        {item.expectedRate === null
                          ? "-"
                          : formatPercent(item.expectedRate)}
                      </b>
                    </div>
                    <span className="analytics-rate-row__track analytics-rate-row__track--expected">
                      <i style={{ width: `${expectedWidth}%` }} />
                    </span>
                  </div>
                  <div className="analytics-rate-row__difference-wrap">
                    <span>Difference</span>
                    <strong
                      className={`analytics-rate-row__difference ${difference !== null && difference >= 0 ? "positive" : "negative"}`}
                    >
                      {difference === null
                        ? "-"
                        : `${difference >= 0 ? "+" : ""}${difference.toFixed(1)}%`}
                    </strong>
                  </div>
                </div>
              );
            })}
        </div>
      </Paper>

      <Paper
        className="analytics-panel analytics-products content-panel"
        elevation={0}
      >
        <Typography variant="h6">Product comparison</Typography>
        <Alert severity="warning" className="analytics-products__warning">
          Informational only: these figures are not a recommendation for which
          product to buy. Results are based on recorded data and normalized by
          the number of boosters represented. A blister contains 2 boosters,
          while an ETB contains 9, so sample sizes differ. Observed rates are
          not guaranteed product odds.
        </Alert>
        {productAnalyticsLoading ? (
          <div className="analytics-products__state">
            <CircularProgress size={24} />
            <Typography color="text.secondary">
              Loading product comparison…
            </Typography>
          </div>
        ) : productAnalyticsError ? (
          <Typography color="error">{productAnalyticsError}</Typography>
        ) : productAnalytics.length === 0 ? (
          <Typography color="text.secondary">
            No product records are available for this set.
          </Typography>
        ) : (
          <div className="product-card-grid">
            {productAnalytics.map((product, productIndex) => (
              <article
                className={`product-card product-card--${productIndex % 4}`}
                key={product.id}
              >
                <div className="product-card__glow" />
                <div className="product-card__header">
                  <div className="product-card__header__container">
                    <span className="product-card__eyebrow">
                      Product sample
                    </span>
                    <span className="product-card__volume">
                        {product.booster_volume} boosters
                    </span>
                  </div>
                  <h4>{product.name}</h4>
                </div>
                <div className="product-card__stats">
                  <div>
                    <span>Openings</span>
                    <strong>{product.opening_count}</strong>
                  </div>
                  <div>
                    <span>Boosters tracked</span>
                    <strong>{product.total_boosters}</strong>
                  </div>
                  <div>
                    <span>1 in X</span>
                    <strong>
                      {product.one_in_x === null
                        ? "-"
                        : product.one_in_x.toFixed(2)}
                    </strong>
                  </div>
                </div>
                <div className="product-card__rate">
                  <div>
                    <span>Hit rate</span>
                    <strong>{formatPercent(product.hit_rate)}</strong>
                  </div>
                  <div className="product-card__rate-track">
                    <i
                      style={{ width: `${Math.min(100, product.hit_rate)}%` }}
                    />
                  </div>
                  <small>
                    {product.total_hits} hits ·{" "}
                    {formatPercent(product.no_hit_rate)} no-hit
                  </small>
                </div>
                <div className="product-card__rarities">
                  {data.rarities
                    .filter((item) => item.key !== "noHit")
                    .map((item) => (
                      <div className="product-card__rarity" key={item.key}>
                        <div>
                          <span>
                            <i style={{ backgroundColor: item.color }} />
                            {columns.find((column) => column.key === item.key)?.fullName ?? item.label}
                          </span>
                          <strong>
                            {formatPercent(product.rarity_rates[item.key] ?? 0)}
                          </strong>
                        </div>
                        <span className="product-card__rarity-track">
                          <i
                            style={{
                              width: `${Math.min(100, product.rarity_rates[item.key] ?? 0)}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </span>
                      </div>
                    ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </Paper>
    </section>
  );
}

export default AnalyticsView;
