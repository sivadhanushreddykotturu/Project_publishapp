import { MailWarning } from "lucide-react";
import { serverApi } from "@/lib/server-api";
import { EmptySection } from "@/components/dash/EmptySection";
import { StatusPill } from "@/components/dash/StatusPill";
import { ActionButton } from "@/components/admin/ActionButton";

export const dynamic = "force-dynamic";

interface EmailRow {
  _id: string;
  type: string;
  status: string;
  attempts: number;
  lastError?: string;
  payload: { title: string };
  recipientId?: { name?: string; email?: string };
  createdAt: string;
}

export default async function AdminNotificationsPage() {
  let emails: EmailRow[] = [];
  try {
    const data = await serverApi<{ notifications: EmailRow[] }>("/notifications");
    emails = data.notifications;
  } catch {
    emails = [];
  }

  if (emails.length === 0) {
    return (
      <EmptySection
        icon={MailWarning}
        title="No email traffic yet"
        body="Every email dispatch is queued, attempted, and visible here — with manual resend for anything stuck."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-black/5 bg-white shadow-sm">
      <table className="w-full text-left text-[14px]">
        <thead>
          <tr className="border-b border-black/5 text-[12px] uppercase tracking-[0.08em] text-ink-400">
            <th className="px-6 py-4 font-semibold">Recipient</th>
            <th className="px-6 py-4 font-semibold">Type</th>
            <th className="px-6 py-4 font-semibold">Subject</th>
            <th className="px-6 py-4 font-semibold">Status</th>
            <th className="px-6 py-4 font-semibold" />
          </tr>
        </thead>
        <tbody>
          {emails.map((n) => (
            <tr key={n._id} className="border-b border-black/5 last:border-0">
              <td className="px-6 py-4">
                <span className="font-medium text-ink-950">
                  {n.recipientId?.name ?? "—"}
                </span>
                <span className="block text-[12.5px] text-ink-400">
                  {n.recipientId?.email}
                </span>
              </td>
              <td className="px-6 py-4 font-mono text-[12px] text-ink-600">{n.type}</td>
              <td className="max-w-[260px] truncate px-6 py-4 text-[13px] text-ink-600">
                {n.payload.title}
                {n.lastError && (
                  <span className="block truncate text-[11.5px] text-rose-500">
                    {n.lastError}
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                <StatusPill status={n.status} />
                <span className="ml-2 text-[11.5px] text-ink-400">
                  ×{n.attempts}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                {n.status !== "sent" && (
                  <ActionButton
                    endpoint={`/notifications/${n._id}/resend`}
                    label="Resend"
                    tone="lime"
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
