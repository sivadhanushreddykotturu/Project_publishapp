import { PackageTier } from "../models/enums";

/** Package pricing & minimums (PRD §6). Amounts in paise (minor units). */
export const PACKAGE_CONFIG: Record<
  PackageTier,
  { label: string; basePricePaise: number; minTesters: number; pricePerExtraTesterPaise: number }
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

export function computeInvoiceAmount(pkg: PackageTier, requiredTesters: number) {
  const config = PACKAGE_CONFIG[pkg];
  const extraTesters = Math.max(0, requiredTesters - config.minTesters);
  const amount = config.basePricePaise + extraTesters * config.pricePerExtraTesterPaise;
  const gst = Math.round(amount * GST_RATE);
  return { amount, gst };
}
