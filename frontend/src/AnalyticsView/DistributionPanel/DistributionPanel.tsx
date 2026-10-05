import {
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useState } from "react";
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
import type { AnalyticsData } from "../../domain/analytics";
import type { ProductAnalytics } from "../../types";
import "./DistributionPanel.scss";

type ChartDatum = {
  id: string;
  label: string;
  arcLabel: string;
  value: number;
  displayValue: number;
  percentage: number;
  color: string;
  denominator: number;
};

type ChartMode = "product" | "rarity";

const SATURATION = 72;
const HUE = 80;
const VALUE = 52;
const HIT_COLOR = `hsl(${HUE} ${SATURATION}% ${VALUE}%)`;
const NO_HIT_COLOR = `hsl(0, 1%, 73.5%)`;

function buildRarityColors(rarities: AnalyticsData["rarities"]) {
  const activeRarities = rarities.filter((item) => item.key !== "noHit");
  const colorByKey = new Map<string, string>();
  activeRarities.forEach((item, index) => {
    const luminance = 28 + 50 * (activeRarities.length - index) / (activeRarities.length);
    colorByKey.set(item.key, `hsl(${HUE} ${SATURATION}% ${luminance}%)`);
  });
  return colorByKey;
}

function buildProductColors(products: ProductAnalytics[]) {
  return new Map(products.map((product, index) => {
    const hue = (18 + (index * 360) / Math.max(products.length, 1)) % 360;
    return [product.id, `hsl(${hue} ${SATURATION}% 48%)`];
  }));
}

function getContrastingTextColor(color: string | number) {
  if (typeof color !== "string") return "#000";

  const hexMatch = color.match(/^#([\da-f]{6})$/i);
  const hslMatch = color.match(/^hsl\(\s*(-?[\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)$/i);
  const rgbMatch = color.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  let rgb: number[];

  if (hexMatch) {
    const value = hexMatch[1];
    rgb = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
  } else if (hslMatch) {
    const hue = ((Number(hslMatch[1]) % 360) + 360) % 360 / 360;
    const saturation = Number(hslMatch[2]) / 100;
    const lightness = Number(hslMatch[3]) / 100;
    const channel = (offset: number) => {
      const position = (offset + hue * 12) % 12;
      const amplitude = saturation * Math.min(lightness, 1 - lightness);
      return (lightness - amplitude * Math.max(
        -1,
        Math.min(position - 3, 9 - position, 1),
      )) * 255;
    };
    rgb = [channel(0), channel(8), channel(4)];
  } else if (rgbMatch) {
    rgb = rgbMatch.slice(1, 4).map(Number);
  } else {
    return "#000";
  }

  const luminance = rgb
    .map((value) => value / 255)
    .map((value) => value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  const blackContrast = (luminance + 0.05) / 0.05;
  const whiteContrast = 1.05 / (luminance + 0.05);
  return whiteContrast > blackContrast ? "#fff" : "#000";
}

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
  color,
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
  const getLabelTextAnchor = () =>
    to(
      [
        startAngle,
        endAngle,
        paddingAngle,
        arcLabelRadius,
        cornerRadius,
        _outerRadius,
      ],
      (start, end, padding, radius, corner, outerRadius) => {
        if (radius <= outerRadius) return "middle";
        const [x] = d3Arc().cornerRadius(corner).centroid({
          padAngle: padding,
          startAngle: start,
          endAngle: end,
          innerRadius: radius,
          outerRadius: radius,
        });
        if (Math.abs(x) < 4) return "middle";
        return x < 0 ? "end" : "start";
      },
    );
  const getLabelFill = () =>
    to(
      [arcLabelRadius, _outerRadius, color],
      (radius, outerRadius, sliceColor) =>
        radius <= outerRadius ? getContrastingTextColor(sliceColor) : "currentColor",
    );

  return (
    <animated.text
      {...other}
      className={classes?.root ?? pieArcLabelClasses.root}
      style={{
        x: getLabelPosition("x"),
        y: getLabelPosition("y"),
        ...style,
        textAnchor: getLabelTextAnchor(),
        fill: getLabelFill(),
      }}
    >
      {percentage ? (
        <>
          <tspan dy="-0.55em">{label}</tspan>
          <tspan x="0" dy="1.1em">{percentage}</tspan>
        </>
      ) : (
        <tspan>{label}</tspan>
      )}
    </animated.text>
  );
}

function NestedPieChart({
  mode,
  rarities,
  outcomes,
  products,
}: {
  mode: ChartMode;
  rarities: AnalyticsData["rarities"];
  outcomes: AnalyticsData["rarities"];
  products: ProductAnalytics[];
}) {
  const isNarrow = useMediaQuery("(max-width: 420px)");
  const isCompact = useMediaQuery("(min-width: 421px) and (max-width: 640px)");
  const totalBoosters = outcomes.reduce((sum, item) => sum + item.count, 0);
  const rarityColors = buildRarityColors(rarities);
  const productColors = buildProductColors(products);
  const productBoosterTotal = products.reduce(
    (sum, product) => sum + product.total_boosters,
    0,
  );
  const productsWithBoosters = products.filter(
    (product) => product.total_boosters > 0,
  );

  const outcomeData: ChartDatum[] = outcomes
    .filter((item) => item.count > 0)
    .map((item) => ({
      id: item.key,
      label: `${item.key === "hit" ? "Hit" : "No hit"}:`,
      arcLabel: item.key === "hit" ? "Hit" : "No hit",
      value: item.count,
      displayValue: item.count,
      percentage: totalBoosters ? (item.count / totalBoosters) * 100 : 0,
      color: item.key === "noHit" ? NO_HIT_COLOR : HIT_COLOR,
      denominator: totalBoosters,
    }));
  const rarityData: ChartDatum[] = rarities
    .filter((item) => item.count > 0)
    .map((item) => ({
      id: item.key,
      label: `${item.label}:`,
      arcLabel: item.label,
      value: item.count,
      displayValue: item.count,
      percentage: totalBoosters ? (item.count / totalBoosters) * 100 : 0,
      color: item.key === "noHit"
        ? NO_HIT_COLOR
        : rarityColors.get(item.key) ?? "#96d93f",
      denominator: totalBoosters,
    }));

  const productData: ChartDatum[] = productsWithBoosters.map((product) => ({
      id: `product-${product.id}`,
      label: `${product.name}:`,
      arcLabel: product.name,
      value: 1,
      displayValue: product.total_boosters,
      percentage: productsWithBoosters.length
        ? 100 / productsWithBoosters.length
        : 0,
      color: productColors.get(product.id) ?? "#3478b8",
      denominator: productBoosterTotal,
    }));
  const productOutcomeData: ChartDatum[] = products.flatMap((product) => {
    const baseHue = 18 + (products.findIndex((item) => item.id === product.id) * 360)
      / Math.max(products.length, 1);
    const productTotal = product.total_hits + product.no_hit_boosters;
    return [
      {
        id: `product-${product.id}-hit`,
        label: `${product.name} · Hit:`,
        arcLabel: "Hit",
        value: productTotal ? product.total_hits / productTotal : 0,
        displayValue: product.total_hits,
        percentage: productTotal ? (product.total_hits / productTotal) * 100 : 0,
        color: `hsl(${baseHue} 68% 43%)`,
        denominator: productTotal,
      },
      {
        id: `product-${product.id}-no-hit`,
        label: `${product.name} · No hit:`,
        arcLabel: "No hit",
        value: productTotal
          ? product.no_hit_boosters / productTotal
          : 0,
        displayValue: product.no_hit_boosters,
        percentage: productTotal
          ? (product.no_hit_boosters / productTotal) * 100
          : 0,
        color: `hsl(${baseHue} 60% 74%)`,
        denominator: productTotal,
      },
    ].filter((item) => item.value > 0);
  });

  const innerData = mode === "product" ? productData : outcomeData;
  const outerData = mode === "product" ? productOutcomeData : rarityData;

  return (
    <div className="analytics-donut-wrap">
      <PieChart
        className="analytics-donut"
        height={isNarrow ? 360 : isCompact ? 460 : 620}
        margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
        series={[
          {
            data: innerData,
            innerRadius: isNarrow ? 38 : isCompact ? 46 : "22%",
            outerRadius: isNarrow ? 92 : isCompact ? 110 : "64.25%",
            arcLabel: (item) => innerData.find((entry) => entry.id === item.id)?.arcLabel?.split(" ").join("\n") ?? "Product",
            valueFormatter: (item, { dataIndex }) => {
              const datum = innerData[dataIndex];
              return `${(datum?.displayValue ?? Number(item.value)).toLocaleString()} out of ${datum?.denominator.toLocaleString() ?? 0} boosters`;
            },
            highlightScope: { fade: "global", highlight: "item" },
            highlighted: { additionalRadius: 3 },
            paddingAngle: 0.25,
            cornerRadius: 4,
          },
          {
            data: outerData,
            innerRadius: isNarrow ? 94 : isCompact ? 113 : "64.75%",
            outerRadius: isNarrow ? 108 : isCompact ? 140 : "76%",
            arcLabel: (item) => {
              const datum = outerData.find((entry) => entry.id === item.id);
              return `${datum?.arcLabel ?? item.label}\n(${datum?.percentage.toFixed(0) ?? 0}%)`;
            },
            arcLabelRadius: isNarrow ? 126 : isCompact ? 164 : "84%",
            valueFormatter: (item, { dataIndex }) => {
              const datum = outerData[dataIndex];
              return `${(datum?.displayValue ?? Number(item.value)).toLocaleString()} out of ${datum?.denominator.toLocaleString() ?? 0} boosters`;
            },
            highlightScope: { fade: "global", highlight: "item" },
            highlighted: { additionalRadius: 3 },
            paddingAngle: 0.25,
            cornerRadius: 4,
          },
        ]}
        slots={{ pieArcLabel: MultilinePieArcLabel }}
        slotProps={{ legend: { hidden: true } }}
        sx={{
          [`& .${pieArcLabelClasses.root}`]: {
            fontSize: isNarrow ? "9px" : isCompact ? "11px" : "16px",
            fontWeight: 600,
          },
        }}
      >
        <PieCenterLabel>{mode === "rarity" ? "Rarity" : "Product"}</PieCenterLabel>
      </PieChart>
    </div>
  );
}

type DistributionPanelProps = {
  rarities: AnalyticsData["rarities"];
  outcomes: AnalyticsData["rarities"];
  products: ProductAnalytics[];
  productsLoading: boolean;
  productsError: string;
};

function DistributionPanel({
  rarities,
  outcomes,
  products,
  productsLoading,
  productsError,
}: DistributionPanelProps) {
  const [mode, setMode] = useState<ChartMode>("product");

  return (
    <Paper className="analytics-panel analytics-distribution-panel content-panel" elevation={0}>
      <div>
        <Typography variant="h6">Distribution</Typography>
        <Typography className="analytics-panel__subtitle">
          {mode === "product"
            ? "Inner ring shows boosters opened per product; outer ring shows hits and no hits."
            : "Inner ring shows hit outcomes; outer ring shows rarity distribution."}
        </Typography>
      </div>
      <ToggleButtonGroup
        className="analytics-distribution-toggle"
        color="primary"
        size="small"
        value={mode}
        exclusive
        aria-label="Distribution chart view"
        onChange={(_, nextMode: ChartMode | null) => {
          if (nextMode) setMode(nextMode);
        }}
      >
        <ToggleButton value="product">Products</ToggleButton>
        <ToggleButton value="rarity">Rarities</ToggleButton>
      </ToggleButtonGroup>
      <div className="analytics-chart-content analytics-chart-content--nested">
        {mode === "product" && productsLoading ? (
          <div className="analytics-chart-empty">Loading product data…</div>
        ) : mode === "product" && productsError ? (
          <div className="analytics-chart-empty">{productsError}</div>
        ) : mode === "product" && products.length === 0 ? (
          <div className="analytics-chart-empty">No product data for this set.</div>
        ) : (
          <NestedPieChart
            mode={mode}
            rarities={rarities}
            outcomes={outcomes}
            products={products}
          />
        )}
      </div>
    </Paper>
  );
}

export default DistributionPanel;
