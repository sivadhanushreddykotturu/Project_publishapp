"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Paperclip, X } from "lucide-react";
import { api, ApiClientError } from "@/lib/api";
import { uploadFile, type UploadedAsset } from "@/lib/upload";

interface Props {
  projects: Array<{ projectId: string; appName: string }>;
}

const CATEGORIES = ["crash", "ui", "performance", "network", "functional", "other"];
const SEVERITIES = ["low", "medium", "high", "critical"];

export function BugReportForm({ projects }: Props) {
  const router = useRouter();
  const { getToken } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState(projects[0]?.projectId ?? "");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("functional");
  const [severity, setSeverity] = useState("medium");
  const [deviceModel, setDeviceModel] = useState("");
  const [androidVersion, setAndroidVersion] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [attachments, setAttachments] = useState<UploadedAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function attach(file: File) {
    setError(null);
    try {
      const asset = await uploadFile(file, "bug-attachments", projectId, getToken);
      setAttachments((a) => [...a, asset].slice(0, 5));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const token = await getToken();
      await api(`/projects/${projectId}/bug-reports`, {
        token,
        method: "POST",
        body: {
          title,
          description,
          category,
          severity,
          device: { model: deviceModel, androidVersion },
          expectedResult: expected,
          actualResult: actual,
          stepsToReproduce: steps.split("\n").map((s) => s.trim()).filter(Boolean),
          attachments: attachments.map((a) => ({
            url: a.url,
            publicId: a.publicId,
            resourceType: a.resourceType,
            bytes: a.bytes,
            hash: a.hash,
          })),
        },
      });
      router.refresh();
      setOpen(false);
      setTitle(""); setDescription(""); setExpected(""); setActual("");
      setSteps(""); setAttachments([]);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not file the report");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-[24px] border-2 border-dashed border-black/10 bg-white/60 px-8 py-10 text-[15px] font-semibold text-ink-800 transition-colors hover:border-orange-400 hover:text-orange-600"
      >
        + File a bug report
      </button>
    );
  }

  const inputCls =
    "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[14px] outline-none placeholder:text-ink-400 focus:border-ink-950";

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-[24px] border border-black/5 bg-white p-7 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-semibold text-ink-950">New bug report</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="text-ink-400 hover:text-ink-950"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-800">Project</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className={inputCls}
          >
            {projects.map((p) => (
              <option key={p.projectId} value={p.projectId}>
                {p.appName}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-800">Title</span>
          <input
            required
            minLength={4}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Crash on launch"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-800">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-800">Severity</span>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={inputCls}>
            {SEVERITIES.map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-800">Device model</span>
          <input
            required
            value={deviceModel}
            onChange={(e) => setDeviceModel(e.target.value)}
            placeholder="Pixel 8a"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-800">Android version</span>
          <input
            required
            value={androidVersion}
            onChange={(e) => setAndroidVersion(e.target.value)}
            placeholder="15"
            className={inputCls}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-800">What happened?</span>
        <textarea
          required
          minLength={10}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={`${inputCls} resize-none`}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-800">Expected</span>
          <textarea required value={expected} onChange={(e) => setExpected(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-800">Actual</span>
          <textarea required value={actual} onChange={(e) => setActual(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-800">
          Steps to reproduce <span className="text-ink-400">(one per line)</span>
        </span>
        <textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
      </label>

      {/* attachments */}
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/mp4,video/quicktime"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void attach(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2.5 text-[13px] font-semibold text-ink-800 transition-colors hover:border-black/25"
        >
          <Paperclip className="size-4" />
          Attach evidence ({attachments.length}/5)
        </button>
        {attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {attachments.map((a) => (
              <span
                key={a.publicId}
                className="rounded-full bg-lime-200 px-3 py-1 text-[11.5px] font-medium text-ink-800"
              >
                {a.publicId.split("/").pop()}
              </span>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-orange-500/10 px-4 py-3 text-[13.5px] text-orange-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-ink-950 py-3.5 text-[15px] font-semibold text-white transition-all enabled:hover:scale-[1.01] disabled:opacity-40"
      >
        {busy ? "Filing…" : "File report"}
      </button>
    </form>
  );
}
