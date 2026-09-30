export const MILESTONE_STATUS = {
  draft: "draft",
  funded: "funded",
  submitted: "submitted",
  released: "released",
  disputed: "disputed",
  refunded: "refunded",
} as const;

export type MilestoneStatus =
  (typeof MILESTONE_STATUS)[keyof typeof MILESTONE_STATUS];

export function autoReleaseMs() {
  const raw = process.env.AUTO_RELEASE_MS;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 7 * 24 * 60 * 60 * 1000;
}

export function formatInr(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

export function rupeesToPaise(rupees: string | number) {
  const n = typeof rupees === "number" ? rupees : Number(rupees);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Amount must be a positive number of rupees.");
  }
  return Math.round(n * 100);
}
