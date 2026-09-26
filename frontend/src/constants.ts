import type { ChipProps } from "@mui/material/Chip";
import { RecordRow } from "./types";

export const productColors: ChipProps["color"][] = [
  "primary",
  "secondary",
  "success",
  "warning",
  "info",
  "error",
];

export const TAB_NAMES = {
  SUMMARY: "Hall of Fame",
  ANALYTICS: "Analytics",
};

export const columns: Array<{
  key: keyof RecordRow;
  label: string;
  className: string;
}> = [
  { key: "name", label: "Name", className: "name-column" },
  {
    key: "total_boosters",
    label: "Booster #",
    className: "total_boosters-column",
  },
  { key: "ex", label: "Ex", className: "ex-column" },
  { key: "ir", label: "IR", className: "ir-column" },
  { key: "sir", label: "SIR", className: "sir-column" },
  { key: "cc", label: "CC", className: "cc-column" },
  { key: "fr", label: "FR", className: "fr-column" },
  { key: "hr", label: "HR", className: "hr-column" },
  { key: "total", label: "Total", className: "total-column" },
  {
    key: "biggest_hit_link",
    label: "Biggest hit",
    className: "biggest_hit_link-column",
  },
  { key: "in_product_id", label: "Product", className: "in_product_id-column" },
  { key: "price", label: "Price", className: "price-column" },
];

export const availableRarities: Array<keyof RecordRow> = [
  "ex",
  "ir",
  "sir",
  "cc",
  "fr",
  "hr",
];
