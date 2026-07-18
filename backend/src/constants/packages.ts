import { PackageTier } from "../models/enums";

/**
 * Package pricing & minimums (PRD §6). Amounts in paise (minor units). "custom" has no
 * fixed entry here on purpose — it's a bespoke, admin-negotiated deal (per the client's
 * "custom plan" feedback); the admin sets the invoice amount directly when approving
 * verification instead of using a formula.
 */
export const PACKAGE_CONFIG: Partial<
  Record<PackageTier, { label: string; basePricePaise: number; minTesters: number; pricePerExtraTesterPaise: number }>
> = {
  testers_only: { label: "Testers Only", basePricePaise: 500000, minTesters: 14, pricePerExtraTesterPaise: 20000 },
  managed_testing: {
    label: "Managed Testing",
    basePricePaise: 1500000,
    minTesters: 14,
    pricePerExtraTesterPaise: 25000,
  },
  launch_ready: { label: "Launch Ready", basePricePaise: 3500000, minTesters: 14, pricePerExtraTesterPaise: 30000 },
};

export const GST_RATE = 0.18;

/**
 * Packages where LaunchOps takes over Play Console management need the client verified
 * (Play Console access proof) and a direct discussion before payment unlocks — self-serve
 * "testers only" projects skip this entirely.
 */
export function requiresClientVerification(pkg: PackageTier): boolean {
  return pkg !== "testers_only";
}

export function computeInvoiceAmount(pkg: PackageTier, requiredTesters: number) {
  const config = PACKAGE_CONFIG[pkg];
  if (!config) {
    throw new Error(`"${pkg}" has no fixed pricing — set the invoice amount manually`);
  }
  const extraTesters = Math.max(0, requiredTesters - config.minTesters);
  const amount = config.basePricePaise + extraTesters * config.pricePerExtraTesterPaise;
  const gst = Math.round(amount * GST_RATE);
  return { amount, gst };
}
