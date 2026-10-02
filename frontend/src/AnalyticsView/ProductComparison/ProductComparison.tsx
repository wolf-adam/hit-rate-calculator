import { Alert, CircularProgress, Paper, Typography } from "@mui/material";
import { columns } from "../../config/constants";
import type { AnalyticsData } from "../../domain/analytics";
import type { ProductAnalytics } from "../../types";
import "./ProductComparison.scss";

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatBoosterCount(value: number) {
  return `${value.toLocaleString()} booster${value > 1 ? "s" : ""}`;
}

type ProductRarityKey = "ex" | "ir" | "sir" | "fr" | "hr" | "cc";

type ProductComparisonProps = {
  rarities: AnalyticsData["rarities"];
  products: ProductAnalytics[];
  loading: boolean;
  error: string;
};

function ProductComparison({
  rarities,
  products,
  loading,
  error,
}: ProductComparisonProps) {
  return (
    <Paper className="analytics-panel analytics-products content-panel" elevation={0}>
      <Typography variant="h6">Product comparison</Typography>
      <Alert severity="warning" className="analytics-products__warning">
        Informational only: these figures are not a recommendation for which
        product to buy. Results are based on recorded data and normalized by
        the number of boosters represented. A blister contains 2 boosters,
        while an ETB contains 9, so sample sizes differ. Observed rates are
        not guaranteed product odds.
      </Alert>
      {loading ? (
        <div className="analytics-products__state">
          <CircularProgress size={24} />
          <Typography color="text.secondary">
            Loading product comparison…
          </Typography>
        </div>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : products.length === 0 ? (
        <Typography color="text.secondary">
          No product records are available for this set.
        </Typography>
      ) : (
        <div className="product-card-grid">
          {products.map((product, productIndex) => (
            <article
              className={`product-card product-card--${productIndex % 4}`}
              key={product.id}
            >
              <div className="product-card__glow" />
              <div className="product-card__header">
                <div className="product-card__header__container">
                  <span className="product-card__eyebrow">Product sample</span>
                  <span className="product-card__volume">
                    {product.booster_volume} boosters
                  </span>
                </div>
                <h4>{product.name}</h4>
              </div>
              <div className="product-card__stats">
                <div>
                  <span>Opened</span>
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
                  <b>Hit rate</b>
                  <strong>{formatPercent(product.hit_rate)}</strong>
                </div>
                <div className="product-card__rate-track">
                  <i style={{ width: `${Math.min(100, product.hit_rate)}%` }} />
                </div>
                <small>
                  {product.total_hits} hits · {formatPercent(product.no_hit_rate)} no-hit
                </small>
              </div>
              <div className="product-card__rarities">
                {rarities
                  .filter((item) => item.key !== "noHit")
                  .map((item) => {
                    const rarityKey = item.key as ProductRarityKey;
                    const rarityCount = product[rarityKey];

                    return (
                      <div className="product-card__rarity" key={item.key}>
                      <div>
                        <span>
                          <i style={{ backgroundColor: item.color }} />
                          {columns.find((column) => column.key === item.key)?.fullName ?? item.label}
                        </span>
                        <strong>
                          {`${formatPercent(product.rarity_rates[item.key] ?? 0)} (${formatBoosterCount(rarityCount)})`}
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
                    );
                  })}
              </div>
            </article>
          ))}
        </div>
      )}
    </Paper>
  );
}

export default ProductComparison;
