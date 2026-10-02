import { Paper, Typography } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import {
  pieArcLabelClasses,
  type PieArcLabelProps,
} from "@mui/x-charts/PieChart/PieArcLabel";
import { useDrawingArea } from "@mui/x-charts/hooks";
import { styled } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import { animated, to } from "@react-spring/web";
import { arc as d3Arc } from "@mui/x-charts-vendor/d3-shape";
import { columns } from "../../config/constants";
import type { AnalyticsData } from "../../domain/analytics";
import "./DistributionPanel.scss";

type ChartDatum = {
  id: string;
  label: string;
  value: number;
  percentage: number;
  color: string;
};

const ChartCenterLabel = styled("text")(({ theme }: { theme: Theme }) => ({
  fill: theme.palette.text.primary,
  textAnchor: "middle",
  dominantBaseline: "central",
  fontSize: 18,
  fontWeight: 600,
}));

function PieCenterLabel({ children }: { children: React.ReactNode }) {
  const { width, height, left, top } = useDrawingArea();
  return (
    <ChartCenterLabel x={left + width / 2} y={top + height / 2}>
      {children}
    </ChartCenterLabel>
  );
}

function MultilinePieArcLabel({
  id: _id,
  classes,
  color: _color,
  startAngle,
  endAngle,
  paddingAngle,
  arcLabelRadius,
  innerRadius: _innerRadius,
  outerRadius: _outerRadius,
  cornerRadius,
  formattedArcLabel,
  isHighlighted: _isHighlighted,
  isFaded: _isFaded,
  style,
  ...other
}: PieArcLabelProps) {
  const [label, percentage] = (formattedArcLabel ?? "").split("\n");

  const getLabelPosition = (variable: "x" | "y") =>
    to(
      [startAngle, endAngle, paddingAngle, arcLabelRadius, cornerRadius],
      (start, end, padding, radius, corner) => {
        const [x, y] = d3Arc().cornerRadius(corner).centroid({
          padAngle: padding,
          startAngle: start,
          endAngle: end,
          innerRadius: radius,
          outerRadius: radius,
        });
        return variable === "x" ? x : y;
      },
    );

  return (
    <animated.text
      {...other}
      className={classes?.root ?? pieArcLabelClasses.root}
      style={{
        x: getLabelPosition("x"),
        y: getLabelPosition("y"),
        ...style,
      }}
    >
      <tspan dy="-0.55em">{label}</tspan>
      <tspan x="0" dy="1.1em">
        {percentage}
      </tspan>
    </animated.text>
  );
}

function NestedPieChart({
  rarities,
  outcomes,
}: {
  rarities: AnalyticsData["rarities"];
  outcomes: AnalyticsData["rarities"];
}) {
  const totalBoosters = outcomes.reduce((sum, item) => sum + item.count, 0);
  const outcomeData: ChartDatum[] = outcomes.map((item) => ({
    id: item.key,
    label: item.key === "hit" ? "Hit" : "No hit",
    value: item.count,
    percentage: totalBoosters ? (item.count / totalBoosters) * 100 : 0,
    color: item.key === "hit" ? "#5ebc6c" : "#c992927d",
  }));
  const rarityData: ChartDatum[] = rarities.map((item) => ({
    id: item.key,
    label: item.label,
    value: item.count,
    percentage: totalBoosters ? (item.count / totalBoosters) * 100 : 0,
    color: item.color,
  }));

  return (
    <div className="analytics-donut-wrap">
      <PieChart
        className="analytics-donut"
        height={400}
        margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
        series={[
          {
            data: outcomeData,
            innerRadius: 48,
            outerRadius: 110,
            arcLabel: (item) => {
              const datum = outcomeData.find((entry) => entry.id === item.id);
              return `${item.label}\n(${datum?.percentage.toFixed(0) ?? 0}%)`;
            },
            valueFormatter: ({ value }) => `${value} boosters`,
            highlightScope: { fade: "global", highlight: "item" },
            highlighted: { additionalRadius: 3 },
            paddingAngle: 1,
            cornerRadius: 2,
          },
          {
            data: rarityData,
            innerRadius: 112,
            outerRadius: 142,
            arcLabel: (item) => {
              const datum = rarityData.find((entry) => entry.id === item.id);
              return `${item.label}\n(${datum?.percentage.toFixed(0) ?? 0}%)`;
            },
            arcLabelRadius: 170,
            valueFormatter: ({ value }) => `${value} hits`,
            highlightScope: { fade: "global", highlight: "item" },
            highlighted: { additionalRadius: 3 },
            paddingAngle: 1,
            cornerRadius: 2,
          },
        ]}
        slots={{ pieArcLabel: MultilinePieArcLabel }}
        slotProps={{ legend: { hidden: true } }}
        sx={{
          [`& .${pieArcLabelClasses.root}`]: {
            fontSize: "11px",
            fontWeight: 600,
          },
        }}
      >
        <PieCenterLabel>Hit mix</PieCenterLabel>
      </PieChart>
    </div>
  );
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
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

function NestedDistributionLegend({
  outcomes,
  rarities,
}: {
  outcomes: AnalyticsData["rarities"];
  rarities: AnalyticsData["rarities"];
}) {
  return (
    <div className="analytics-nested-legend">
      <div>
        <strong>Inner · hit outcome</strong>
        <DistributionLegend data={outcomes} />
      </div>
      <div>
        <strong>Outer · rarity</strong>
        <DistributionLegend data={rarities} />
      </div>
    </div>
  );
}

type DistributionPanelProps = {
  rarities: AnalyticsData["rarities"];
  outcomes: AnalyticsData["rarities"];
};

function DistributionPanel({ rarities, outcomes }: DistributionPanelProps) {
  return (
    <Paper className="analytics-panel content-panel" elevation={0}>
      <div>
        <Typography variant="h6">Hit and rarity distribution</Typography>
        <Typography className="analytics-panel__subtitle">
            Inner ring shows hit versus no-hit boosters; outer ring shows rarity.
        </Typography>
      </div>
      <div className="analytics-chart-content analytics-chart-content--nested">
        <NestedPieChart rarities={rarities} outcomes={outcomes} />
        <NestedDistributionLegend outcomes={outcomes} rarities={rarities} />
      </div>
    </Paper>
  );
}

export default DistributionPanel;
