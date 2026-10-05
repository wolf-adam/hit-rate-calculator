import type { RecordRow, SetOption } from "../types";

type RarityKey = "ex" | "ir" | "sir" | "fr" | "hr" | "cc";

type RarityDefinition = {
  key: RarityKey;
  label: string;
  color: string;
};

export const EXPECTED_RATE_SAMPLE_SIZE = 3000;

const publishedExpectedRates: Record<string, Partial<Record<RarityKey, number>>> = {
  "30C": {
    ex: 21.02,
    ir: 19.72,
    cc: 10.15,
    sir: 4.88,
    fr: 0.83,
    hr: 0,
  },
};

const rarityDefinitions: RarityDefinition[] = [
  { key: "ex", label: "EX", color: "#5a9fc2" },
  { key: "ir", label: "IR", color: "#e2766f" },
  { key: "sir", label: "SIR", color: "#a17ac7" },
  { key: "fr", label: "FR", color: "#62a878" },
  { key: "hr", label: "HR", color: "#e2a34f" },
  { key: "cc", label: "CC", color: "#5bbfc0" },
];

export type AnalyticsRarity = {
  key: string;
  label: string;
  color: string;
  count: number;
  observedRate: number;
  expectedRate: number | null;
};

export type AnalyticsData = {
  totalBoosters: number;
  totalHits: number;
  noHitBoosters: number;
  hitRate: number;
  noHitRate: number;
  premiumHits: number;
  oneInX: number | null;
  rarities: AnalyticsRarity[];
};

const expectedRate = (value: number | undefined): number | null => {
  if (value === undefined || !Number.isFinite(value)) return null;
  return value <= 1 ? value * 100 : value;
};

const expectedRateForSet = (
  selectedSet: SetOption | undefined,
  key: RarityKey,
): number | null => {
  const publishedRate = publishedExpectedRates[selectedSet?.short_name ?? ""]?.[key];
  if (publishedRate !== undefined) return publishedRate;
  return expectedRate(selectedSet?.[key]);
};

export function buildAnalyticsData(
  records: RecordRow[],
  selectedSet?: SetOption,
): AnalyticsData {
  const totalBoosters = records.reduce(
    (sum, record) => sum + record.total_boosters,
    0,
  );
  const count = (key: RarityKey) =>
    records.reduce((sum, record) => sum + (record[key] ?? 0), 0);
  const counts = Object.fromEntries(
    rarityDefinitions.map(({ key }) => [key, count(key)]),
  ) as Record<RarityKey, number>;
  const totalHits = rarityDefinitions.reduce(
    (sum, { key }) => sum + counts[key],
    0,
  );
  const noHitBoosters = Math.max(totalBoosters - totalHits, 0);
  const rate = (value: number) =>
    totalBoosters ? (value / totalBoosters) * 100 : 0;
  const premiumHits = counts.sir + counts.fr + counts.hr + counts.cc;
  const activeDefinitions = rarityDefinitions.filter(({ key }) => {
    if (!selectedSet) return true;
    return (expectedRateForSet(selectedSet, key) ?? 0) > 0;
  });
  const rarities: AnalyticsRarity[] = activeDefinitions
    .map(({ key, label, color }) => ({
      key,
      label,
      color,
      count: counts[key],
      observedRate: rate(counts[key]),
      expectedRate: expectedRateForSet(selectedSet, key),
    }))
    .sort((left, right) => right.observedRate - left.observedRate);

  return {
    totalBoosters,
    totalHits,
    noHitBoosters,
    hitRate: rate(totalHits),
    noHitRate: rate(noHitBoosters),
    premiumHits,
    oneInX: totalHits ? totalBoosters / totalHits : null,
    rarities: [
      ...rarities,
      {
        key: "noHit",
        label: "No hit",
        color: "#b9b9b9b1",
        count: noHitBoosters,
        observedRate: rate(noHitBoosters),
        expectedRate: null,
      },
    ],
  };
}
