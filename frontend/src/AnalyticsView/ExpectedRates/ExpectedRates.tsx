import { Paper, Typography } from "@mui/material";
import type { CSSProperties } from "react";
import { columns } from "../../constants";
import type { AnalyticsData } from "../../analytics";
import "./ExpectedRates.scss";

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

type ExpectedRatesProps = {
  rarities: AnalyticsData["rarities"];
};

function ExpectedRates({ rarities }: ExpectedRatesProps) {
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
          <span>
            Expected values come from the selected set’s published pull-rate
            data. The exact source values and link will be added here.
          </span>
        </div>
      </div>
      <div
        className="analytics-rates-list"
        style={{ "--rate-columns": expectedRarities.length } as CSSProperties}
      >
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
            <div className="analytics-rate-row" key={item.key}>
              <div className="analytics-rate-row__label">
                <div className="analytics-rate-row__label-name">
                  <i style={{ backgroundColor: item.color }} />
                  <strong>
                    {label.split(" ").map((word) => (
                      <span key={word}>{word}</span>
                    ))}
                  </strong>
                </div>
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
  );
}

export default ExpectedRates;
