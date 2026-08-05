import { Receipt } from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { EmptySection } from "@/components/dash/EmptySection";
import { StatusPill } from "@/components/dash/StatusPill";
import { formatDate, formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

interface InvoiceRow {
  _id: string;
  packageKey: string;
  amountPaise: number;
  gstPaise: number;
  totalPaise: number;
  status: string;
  createdAt: string;
}

export default async function ClientInvoices() {
  let invoices: InvoiceRow[] = [];
  try {
    const data = await serverApi<{ invoices: InvoiceRow[] }>("/invoices/me");
    invoices = data.invoices;
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
            <th className="px-6 py-4 font-semibold">Package</th>
            <th className="px-6 py-4 font-semibold">Amount</th>
            <th className="px-6 py-4 font-semibold">GST</th>
            <th className="px-6 py-4 font-semibold">Total</th>
            <th className="px-6 py-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv._id} className="border-b border-black/5 last:border-0">
              <td className="px-6 py-4">
                <span className="font-mono text-[12.5px] text-ink-500">
                  {inv._id.slice(-8)}
                </span>
                <span className="block text-[12.5px] text-ink-400">
                  {formatDate(inv.createdAt)}
                </span>
              </td>
              <td className="px-6 py-4 font-medium capitalize text-ink-950">
                {inv.packageKey}
              </td>
              <td className="px-6 py-4 text-ink-600">{formatINR(inv.amountPaise)}</td>
              <td className="px-6 py-4 text-ink-600">{formatINR(inv.gstPaise)}</td>
              <td className="px-6 py-4 font-semibold text-ink-950">
                {formatINR(inv.totalPaise)}
              </td>
              <td className="px-6 py-4">
                <StatusPill status={inv.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
