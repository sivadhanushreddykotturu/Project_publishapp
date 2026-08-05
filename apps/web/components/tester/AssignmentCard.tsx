"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ExternalLink, Hourglass, UploadCloud } from "lucide-react";
import { api, ApiClientError } from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import { StatusPill } from "@/components/dash/StatusPill";

export interface TesterAssignment {
  _id: string;
  status: string;
  currentStep: number;
  queuePosition?: number;
  proofs: Array<{
    _id: string;
    step: number;
    fileUrl: string;
    status: string;
    rejectionReason?: string;
    submittedAt: string;
  }>;
  projectId: {
    _id: string;
    appDetails: { appName: string; packageName: string };
    status: string;
    steps: Array<{
      order: number;
      type: string;
      state: string;
      config: {
        instructions: string;
        requiresProof: boolean;
        projectLevelGate: boolean;
        payoutPaise: number;
      };
    }>;
  };
}

const STEP_LABELS: Record<string, string> = {
  verification: "Verification",
  play_store_invite: "Play Store invite",
  app_usage: "App usage",
  app_testing: "App testing",
  completion: "Completion",
};

export function AssignmentCard({ assignment }: { assignment: TesterAssignment }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const project = assignment.projectId;
  const step = project.steps.find((s) => s.order === assignment.currentStep);
  const gatedLocked =
    step?.config.projectLevelGate && step.state !== "active";
  const hasLiveSubmission = assignment.proofs.some(
    (p) => p.step === assignment.currentStep && p.status === "submitted",
  );

  async function submitFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const asset = await uploadFile(file, "proofs", assignment._id, getToken);
      const token = await getToken();
      await api(`/assignments/${assignment._id}/proofs`, {
        token,
        method: "POST",
        body: { fileUrl: asset.url, publicId: asset.publicId, fileHash: asset.hash },
      });
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitNote() {
    if (!note.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      await api(`/assignments/${assignment._id}/proofs`, {
        token,
        method: "POST",
        body: { fileUrl: `note:${note.trim()}`, note: note.trim() },
      });
      setNote("");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[24px] border border-black/5 bg-white p-7 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[18px] font-semibold text-ink-950">
            {project.appDetails.appName}
          </h3>
          <p className="mt-0.5 text-[12.5px] text-ink-400">
            {project.appDetails.packageName}
          </p>
        </div>
        <StatusPill status={assignment.status} />
      </div>

      {assignment.status === "queued" ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-blue-50 px-5 py-4">
          <Hourglass className="size-5 text-blue-600" />
          <p className="text-[14px] text-blue-900">
            You&apos;re on the waiting list — position{" "}
            <span className="font-semibold">#{assignment.queuePosition}</span>.
            We&apos;ll notify you the moment a slot opens.
          </p>
        </div>
      ) : assignment.status === "completed" ? (
        <div className="mt-5 rounded-2xl bg-emerald-50 px-5 py-4">
          <p className="text-[14px] font-medium text-emerald-900">
            Assignment complete — every step verified. Payouts are in your wallet.
          </p>
        </div>
      ) : step ? (
        <div className="mt-5">
          {/* step progress */}
          <div className="mb-5 flex gap-1.5">
            {project.steps.map((s) => (
              <span
                key={s.order}
                className={`h-1.5 flex-1 rounded-full ${
                  s.order < assignment.currentStep
                    ? "bg-emerald-400"
                    : s.order === assignment.currentStep
                      ? "bg-lime-400"
                      : "bg-black/8"
                }`}
              />
            ))}
          </div>

          <p className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-orange-500">
            Step {step.order} of 5 · {STEP_LABELS[step.type] ?? step.type}
          </p>
          <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-ink-600">
            {step.config.instructions}
          </p>
          <p className="mt-1.5 text-[13px] font-medium text-ink-500">
            Payout on verification: ₹{step.config.payoutPaise / 100}
          </p>

          {step.type === "play_store_invite" && step.state === "active" && (
            <a
              href={`/t/${assignment._id}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-blue-600"
            >
              <ExternalLink className="size-4" />
              Open your testing link
            </a>
          )}

          {gatedLocked ? (
            <p className="mt-4 rounded-2xl bg-paper px-5 py-4 text-[14px] text-ink-500">
              This step opens when the whole group clears the previous one.
              Hang tight.
            </p>
          ) : hasLiveSubmission && step.type !== "app_usage" ? (
            <p className="mt-4 rounded-2xl bg-amber-50 px-5 py-4 text-[14px] text-amber-800">
              Your submission is under review. Payouts credit when an admin
              verifies it.
            </p>
          ) : (
            <div className="mt-4">
              {step.config.requiresProof ? (
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,video/mp4,video/quicktime"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void submitFile(f);
                    }}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-5 py-3 text-[14px] font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-40"
                  >
                    <UploadCloud className="size-4" />
                    {busy ? "Uploading…" : step.type === "app_usage" ? "Upload today's check-in" : "Upload proof screenshot"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="e.g. No issues found — tested login, search, and checkout flows."
                    className="w-full resize-none rounded-2xl border border-black/10 px-4 py-3 text-[14px] outline-none placeholder:text-ink-400 focus:border-ink-950"
                  />
                  <div>
                    <button
                      onClick={submitNote}
                      disabled={busy || !note.trim()}
                      className="rounded-full bg-ink-950 px-5 py-3 text-[14px] font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-40"
                    >
                      {busy ? "Submitting…" : "Submit declaration"}
                    </button>
                  </div>
                </div>
              )}
              {error && (
                <p className="mt-3 rounded-xl bg-orange-500/10 px-4 py-2.5 text-[13px] text-orange-600">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* proof history */}
      {assignment.proofs.length > 0 && (
        <div className="mt-6 border-t border-black/5 pt-4">
          <p className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-400">
            Submissions
          </p>
          <div className="space-y-2">
            {assignment.proofs.map((p) => (
              <div key={p._id} className="flex flex-wrap items-center gap-3 text-[13px]">
                <span className="font-medium text-ink-800">Step {p.step}</span>
                <StatusPill status={p.status} />
                {p.rejectionReason && (
                  <span className="text-rose-600">{p.rejectionReason}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
