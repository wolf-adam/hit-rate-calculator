import { Paper, Typography } from "@mui/material";
import { columns } from "../../constants";
import {
  EXPECTED_RATE_SAMPLE_SIZE,
  type AnalyticsData,
} from "../../analytics";
import "./ExpectedRates.scss";

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function formatConfidenceMargin(rate: number, sampleSize: number) {
  if (sampleSize <= 0) return "±--";

  const probability = Math.min(1, Math.max(0, rate / 100));
  const zScore = 1.96;
  const denominator = 1 + (zScore * zScore) / sampleSize;
  const center =
    (probability + (zScore * zScore) / (2 * sampleSize)) / denominator;
  const margin =
    (zScore *
      Math.sqrt(
        (probability * (1 - probability) +
          (zScore * zScore) / (4 * sampleSize)) /
          sampleSize,
      )) /
    denominator;
  return `±${formatPercent(margin * 100)}`;
}

function formatOneIn(rate: number) {
  if (rate <= 0) return "1 in -- boosters";
  return `1 in ${Math.max(1, Math.round(100 / rate)).toLocaleString()} boosters`;
}

type ExpectedRatesProps = {
  rarities: AnalyticsData["rarities"];
  totalBoosters: number;
};

function ExpectedRates({ rarities, totalBoosters }: ExpectedRatesProps) {
  const expectedRarities = rarities.filter((item) => item.key !== "noHit");

  return (
    <Paper className="analytics-panel analytics-rates content-panel" elevation={0}>
      <Typography variant="h6">Expected vs observed rates</Typography>
      <Typography className="analytics-panel__subtitle">
        Compare your results to the published rates for this set.
      </Typography>
      <div className="analytics-source-banner">
        <span className="analytics-source-banner__icon">i</span>
        <div>
          <strong>About the expected rates</strong>
          <span>Expected values come from the </span>
          <a
            href="https://www.tcgplayer.com/content/article/Pok%C3%A9mon-TCG-30th-Celebration-Pull-Rates/587b3657-481a-4ab8-827c-68cd3ab585b0/"
            target="_blank"
            rel="noreferrer"
          >
            TCGPlayer
          </a>
          <span>'s set analysis of published pull-rate data.<br/>Sampling size is 3000 packs.</span>
        </div>
      </div>
      <div className="analytics-rates-list">
        {expectedRarities.map((item) => {
          const difference =
            item.expectedRate === null
              ? null
              : item.observedRate - item.expectedRate;
          const observedWidth = Math.min(100, item.observedRate);
          const expectedWidth = Math.min(100, item.expectedRate ?? 0);
          const label =
            columns.find((column) => column.key === item.key)?.fullName ??
            item.label;

          return (
            <article
              className="analytics-rate-row"
              key={item.key}
              style={{ borderTopColor: item.color }}
            >
              <div
                className="analytics-rate-row__glow"
                style={{ backgroundColor: item.color }}
              />
              <div className="analytics-rate-row__header">
                <div className="analytics-rate-row__label-name">
                  <i style={{ backgroundColor: item.color }} />
                  <strong>
                    {label.split(" ").map((word) => (
                      <span key={word}>{word}</span>
                    ))}
                  </strong>
                </div>
                <span className="analytics-rate-row__hits">
                  {item.count.toLocaleString()} hits
                </span>
              </div>
              <div className="analytics-rate-row__measures">
                <div className="analytics-rate-row__measure">
                  <div>
                    <span>Observed</span>
                    <b>
                      {formatPercent(item.observedRate)}{" "}
                      <small>
                          [{formatConfidenceMargin(item.observedRate, totalBoosters)}]
                      </small>
                    </b>
                  </div>
                  <span className="analytics-rate-row__track">
                    <i
                      style={{
                        width: `${observedWidth}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </span>
                  <strong className="analytics-rate-row__one-in">
                    {formatOneIn(item.observedRate)}
                  </strong>
                </div>
                <div className="analytics-rate-row__measure">
                  <div>
                    <span>Expected</span>
                    <b>
                      {item.expectedRate === null ? (
                        "-"
                      ) : (
                        <>
                          {formatPercent(item.expectedRate)}{" "}
                          <small>
                            [{formatConfidenceMargin(item.expectedRate, EXPECTED_RATE_SAMPLE_SIZE)}]
                          </small>
                        </>
                      )}
                    </b>
                  </div>
                  <span className="analytics-rate-row__track analytics-rate-row__track--expected">
                    <i style={{ width: `${expectedWidth}%` }} />
                  </span>
                  <strong className="analytics-rate-row__one-in">
                    {formatOneIn(item.expectedRate)}
                  </strong>
                </div>
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
            </article>
          );
        })}
      </div>
    </Paper>
  );
}

export default ExpectedRates;
