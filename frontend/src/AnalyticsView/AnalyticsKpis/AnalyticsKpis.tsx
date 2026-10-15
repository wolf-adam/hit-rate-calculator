import { Tooltip, Typography } from "@mui/material";
import type { ReactNode } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import "./AnalyticsKpis.scss";

type Kpi = {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone: "volume" | "hits" | "premium" | "odds" | "no-hit";
  tooltip?: string;
};

type AnalyticsKpisProps = {
  items: Kpi[];
};

function AnalyticsKpis({ items }: AnalyticsKpisProps) {
  return (
    <section className="analytics-kpi-section" aria-label="Analytics overview">
      <Typography className="analytics-kpi-section__title" component="h2">
        At a glance
      </Typography>
      <div className="analytics-kpis">
        {items.map((item) => (
          <article
            className={`analytics-kpi analytics-kpi--${item.tone}`}
            key={item.label}
          >
            <div className="analytics-kpi__top">
              <div className="analytics-kpi__label-row">
                <span className="analytics-kpi__label">{item.label}</span>
                {item.tooltip && (
                  <Tooltip title={item.tooltip} arrow placement="top">
                    <InfoOutlinedIcon
                      className="analytics-kpi__help"
                      aria-label={`More about ${item.label.toLowerCase()}`}
                      fontSize="small"
                    />
                  </Tooltip>
                )}
              </div>
              <span className="analytics-kpi__icon" aria-hidden="true">
                {item.icon}
              </span>
            </div>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AnalyticsKpis;
