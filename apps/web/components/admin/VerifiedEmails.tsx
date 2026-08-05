"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Copy, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

/** One click: the verified tester email list, ready for the Play track. */
export function VerifiedEmails({ projectId }: { projectId: string }) {
  const { getToken } = useAuth();
  const [emails, setEmails] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const token = await getToken();
      const data = await api<{ emails: string[] }>(
        `/projects/${projectId}/verified-tester-emails`,
        { token },
      );
      setEmails(data.emails);
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!emails) return;
    await navigator.clipboard.writeText(emails.join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (emails === null) {
    return (
      <button
        onClick={load}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-[13px] font-semibold text-ink-800 transition-colors hover:border-black/20"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        Load verified tester emails
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-paper p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-ink-800">
          {emails.length} verified emails — paste into the Play track tester list
        </p>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink-950 px-3.5 py-2 text-[12px] font-semibold text-white"
        >
          <Copy className="size-3.5" />
          {copied ? "Copied" : "Copy all"}
        </button>
      </div>
      <p className="mt-2 break-all font-mono text-[12px] leading-relaxed text-ink-500">
        {emails.join(", ")}
      </p>
    </div>
  );
}
