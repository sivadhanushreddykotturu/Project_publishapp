import { Receipt } from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { EmptySection } from "@/components/dash/EmptySection";
import { StatusPill } from "@/components/dash/StatusPill";
import { ActionButton } from "@/components/admin/ActionButton";
import { formatDate, formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

interface AdminInvoiceRow {
  _id: string;
  packageKey: string;
  totalPaise: number;
  status: string;
  createdAt: string;
  clientId?: { companyName?: string; contactName?: string };
  projectId?: { appDetails?: { appName?: string } };
}

export default async function AdminInvoices() {
  let invoices: AdminInvoiceRow[] = [];
  try {
    const data = await serverApi<{ invoices: AdminInvoiceRow[] }>("/invoices");
    invoices = data.invoices;
  } catch {
    invoices = [];
  }

  if (invoices.length === 0) {
    return (
      <EmptySection
        icon={Receipt}
        title="No invoices yet"
        body="When a client creates a project, its invoice lands here for manual payment confirmation."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-black/5 bg-white shadow-sm">
      <table className="w-full text-left text-[14px]">
        <thead>
          <tr className="border-b border-black/5 text-[12px] uppercase tracking-[0.08em] text-ink-400">
            <th className="px-6 py-4 font-semibold">Client</th>
            <th className="px-6 py-4 font-semibold">Project</th>
            <th className="px-6 py-4 font-semibold">Total</th>
            <th className="px-6 py-4 font-semibold">Status</th>
            <th className="px-6 py-4 font-semibold" />
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv._id} className="border-b border-black/5 last:border-0">
              <td className="px-6 py-4">
                <span className="font-medium text-ink-950">
                  {inv.clientId?.companyName || inv.clientId?.contactName || "—"}
                </span>
                <span className="block text-[12.5px] text-ink-400">
                  {formatDate(inv.createdAt)}
                </span>
              </td>
              <td className="px-6 py-4 text-ink-600">
                {inv.projectId?.appDetails?.appName ?? "—"}
                <span className="block text-[12.5px] capitalize text-ink-400">
                  {inv.packageKey}
                </span>
              </td>
              <td className="px-6 py-4 font-semibold text-ink-950">
                {formatINR(inv.totalPaise)}
              </td>
              <td className="px-6 py-4">
                <StatusPill status={inv.status} />
              </td>
              <td className="px-6 py-4 text-right">
                {inv.status === "pending" && (
                  <ActionButton
                    endpoint={`/invoices/${inv._id}/mark-paid`}
                    label="Mark paid"
                    confirm="Confirm you received this payment? The project activates immediately."
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
