import { Receipt } from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { EmptySection } from "@/components/dash/EmptySection";
import { StatusPill } from "@/components/dash/StatusPill";
import { formatDate, formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

interface InvoiceRow {
  _id: string;
  packageKey?: string;
  package?: string;
  amountPaise?: number;
  amount?: number;
  gstPaise?: number;
  gst?: number;
  totalPaise?: number;
  status: string;
  createdAt: string;
  projectId?: { _id?: string; appDetails?: { appName?: string } } | string;
}

const PACKAGE_NAMES: Record<string, string> = {
  closed_testing_standard: "Play Store Closed Testing",
  starter: "Starter Track",
  growth: "Growth Track",
  scale: "Scale Track",
};

export default async function ClientInvoices() {
  let invoices: InvoiceRow[] = [];
  try {
    const data = await serverApi<{ invoices?: InvoiceRow[] } | InvoiceRow[]>("/invoices/me").catch(
      () => serverApi<{ invoices?: InvoiceRow[] } | InvoiceRow[]>("/invoices?limit=100"),
    );
    invoices =
      data && typeof data === "object" && "invoices" in data && Array.isArray(data.invoices)
        ? data.invoices
        : Array.isArray(data)
        ? data
        : [];
  } catch {
    invoices = [];
  }

  if (invoices.length === 0) {
    return (
      <EmptySection
        icon={Receipt}
        title="No invoices yet"
        body="Invoices appear when you create a project. Each includes GST for your books."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-black/5 bg-white shadow-sm">
      <table className="w-full text-left text-[14px]">
        <thead>
          <tr className="border-b border-black/5 text-[12px] uppercase tracking-[0.08em] text-ink-400">
            <th className="px-6 py-4 font-semibold">Invoice</th>
            <th className="px-6 py-4 font-semibold">Package / App</th>
            <th className="px-6 py-4 font-semibold">Amount</th>
            <th className="px-6 py-4 font-semibold">GST (18%)</th>
            <th className="px-6 py-4 font-semibold">Total</th>
            <th className="px-6 py-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const rawAmount = inv.amountPaise ?? inv.amount ?? 0;
            const rawGst = inv.gstPaise ?? inv.gst ?? Math.round(rawAmount * 0.18);
            const rawTotal = inv.totalPaise ?? rawAmount + rawGst;
            const pkgKey = inv.packageKey ?? inv.package ?? "closed_testing_standard";
            const pkgName = PACKAGE_NAMES[pkgKey] ?? pkgKey;
            const appName =
              typeof inv.projectId === "object" && inv.projectId?.appDetails?.appName
                ? inv.projectId.appDetails.appName
                : null;

            return (
              <tr key={inv._id} className="border-b border-black/5 last:border-0 hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono text-[12.5px] font-semibold text-ink-700">
                    #{inv._id.slice(-8).toUpperCase()}
                  </span>
                  <span className="block text-[12px] text-ink-400">
                    {formatDate(inv.createdAt)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-ink-950 block">{pkgName}</span>
                  {appName && (
                    <span className="text-[12px] text-ink-400 block">{appName}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-ink-600 font-medium">{formatINR(rawAmount)}</td>
                <td className="px-6 py-4 text-ink-600">{formatINR(rawGst)}</td>
                <td className="px-6 py-4 font-bold text-ink-950">
                  {formatINR(rawTotal)}
                </td>
                <td className="px-6 py-4">
                  <StatusPill status={inv.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
