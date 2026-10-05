import { Tooltip } from "@mui/material";
import "./AnalyticsKpis.scss";

type Kpi = {
  label: string;
  value: string;
  detail: string;
  icon: string;
  tooltip?: string;
};

type AnalyticsKpisProps = {
  items: Kpi[];
};

function AnalyticsKpis({ items }: AnalyticsKpisProps) {
  return (
    <div className="analytics-kpis content-panel">
      {items.map((item) => (
        <div className="analytics-kpi" key={item.label}>
          <span className="analytics-kpi__icon">{item.icon}</span>
          <div>
            <span className="analytics-kpi__label">
              {item.tooltip ? (
                <Tooltip title={item.tooltip} arrow placement="top">
                  <span className="analytics-kpi__label--help">
                    {item.label} ⓘ
                  </span>
                </Tooltip>
              ) : (
                item.label
              )}
            </span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AnalyticsKpis;
