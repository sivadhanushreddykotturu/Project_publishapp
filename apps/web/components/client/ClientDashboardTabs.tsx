"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  Smartphone,
  Apple,
  Sparkles,
  ArrowRight,
  Plus,
  MessageSquare,
  X,
  Send,
  CheckCircle2,
} from "lucide-react";
import { StatusPill } from "@/components/dash/StatusPill";
import { formatDate } from "@/lib/format";
import { api } from "@/lib/api";

export interface ProjectRow {
  _id: string;
  packageKey: string;
  projectType?: string;
  status: string;
  joinState: string;
  requiredTesters: number;
  activeTesterCount: number;
  appDetails: { appName: string; packageName: string };
  createdAt: string;
}

type ServiceKey = "playstore" | "ios" | "ux";

interface Props {
  projects: ProjectRow[];
}

export function ClientDashboardTabs({ projects }: Props) {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<ServiceKey>("playstore");

  // Contact Admin modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactBody, setContactBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const androidProjects = projects.filter(
    (p) => !p.projectType || p.projectType === "play_store_internal",
  );
  const iosProjects = projects.filter((p) => p.projectType === "ios_testflight");
  const uxProjects = projects.filter(
    (p) => p.projectType === "ux_testing" || p.projectType === ("ux" as string),
  );

  const activeProjects =
    activeTab === "playstore"
      ? androidProjects
      : activeTab === "ios"
      ? iosProjects
      : uxProjects;

  function openContactModal(track: "ios" | "ux") {
    setContactSubject(
      track === "ios"
        ? "iOS TestFlight Testing Request"
        : "UX & Usability Testing Study Request",
    );
    setContactBody("");
    setSentSuccess(false);
    setContactError(null);
    setModalOpen(true);
  }

  async function handleSendContact(e: React.FormEvent) {
    e.preventDefault();
    if (!contactBody.trim() || sending) return;

    setSending(true);
    setContactError(null);
    try {
      const token = await getToken();
      await api("/support", {
        token,
        method: "POST",
        body: {
          subject: contactSubject,
          body: contactBody.trim(),
        },
      });
      setSentSuccess(true);
      setTimeout(() => {
        setModalOpen(false);
        setSentSuccess(false);
      }, 2500);
    } catch (err) {
      setContactError(err instanceof Error ? err.message : "Failed to send message to admin");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* 3 Service Track Cards */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[19px] font-bold text-ink-950">Select Testing Track</h3>
            <p className="mt-1 text-[14px] text-ink-500">
              Manage your releases across Android, iOS TestFlight, and UX testing.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {/* Android Card */}
          <div
            onClick={() => setActiveTab("playstore")}
            className={`cursor-pointer rounded-[24px] border-2 p-6 transition-all ${
              activeTab === "playstore"
                ? "border-ink-950 bg-white shadow-md ring-2 ring-black/5"
                : "border-black/10 bg-white/70 hover:border-black/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`grid size-12 place-items-center rounded-2xl transition-colors ${
                  activeTab === "playstore"
                    ? "bg-lime-300 text-ink-950"
                    : "bg-paper text-ink-700"
                }`}
              >
                <Smartphone className="size-6" />
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11.5px] font-semibold text-emerald-800">
                {androidProjects.length} {androidProjects.length === 1 ? "app" : "apps"}
              </span>
            </div>
            <h4 className="mt-5 text-[19px] font-bold text-ink-950">
              Android Closed Testing
            </h4>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">
              14 real Android testers for 14 continuous days for Google Play review.
            </p>
          </div>

          {/* iOS Card */}
          <div
            onClick={() => setActiveTab("ios")}
            className={`cursor-pointer rounded-[24px] border-2 p-6 transition-all ${
              activeTab === "ios"
                ? "border-ink-950 bg-white shadow-md ring-2 ring-black/5"
                : "border-black/10 bg-white/70 hover:border-black/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`grid size-12 place-items-center rounded-2xl transition-colors ${
                  activeTab === "ios"
                    ? "bg-blue-500 text-white"
                    : "bg-paper text-ink-700"
                }`}
              >
                <Apple className="size-6" />
              </span>
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11.5px] font-semibold text-blue-800">
                {iosProjects.length} {iosProjects.length === 1 ? "app" : "apps"}
              </span>
            </div>
            <h4 className="mt-5 text-[19px] font-bold text-ink-950">
              iOS TestFlight Testing
            </h4>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">
              TestFlight beta runs with verified real device testers and crash reports.
            </p>
          </div>

          {/* UX Card */}
          <div
            onClick={() => setActiveTab("ux")}
            className={`cursor-pointer rounded-[24px] border-2 p-6 transition-all ${
              activeTab === "ux"
                ? "border-ink-950 bg-white shadow-md ring-2 ring-black/5"
                : "border-black/10 bg-white/70 hover:border-black/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`grid size-12 place-items-center rounded-2xl transition-colors ${
                  activeTab === "ux"
                    ? "bg-purple-500 text-white"
                    : "bg-paper text-ink-700"
                }`}
              >
                <Sparkles className="size-6" />
              </span>
              <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[11.5px] font-semibold text-purple-800">
                {uxProjects.length} {uxProjects.length === 1 ? "study" : "studies"}
              </span>
            </div>
            <h4 className="mt-5 text-[19px] font-bold text-ink-950">
              UX & Usability Testing
            </h4>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">
              Deep qualitative feedback, prototype runs, and user journey reviews.
            </p>
          </div>
        </div>
      </div>

      {/* Projects / Empty State for the active track */}
      <div className="rounded-[28px] border border-black/5 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-black/5">
          <div>
            <div className="flex items-center gap-2.5">
              <h4 className="text-[20px] font-bold text-ink-950">
                {activeTab === "playstore"
                  ? "Android Closed Tests"
                  : activeTab === "ios"
                  ? "iOS TestFlight Projects"
                  : "UX & Usability Studies"}
              </h4>
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[12px] font-semibold text-ink-700">
                {activeProjects.length}
              </span>
            </div>
            <p className="mt-1 text-[14px] text-ink-500">
              {activeTab === "playstore"
                ? "Google Play 14-day closed testing projects."
                : activeTab === "ios"
                ? "Apple TestFlight beta release tracks. Contact admin to coordinate testing."
                : "User experience research and usability studies. Contact admin to coordinate study."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeTab !== "playstore" && (
              <button
                type="button"
                onClick={() => openContactModal(activeTab)}
                className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-5 py-3 text-[14px] font-semibold text-ink-800 transition-colors hover:bg-black/5"
              >
                <MessageSquare className="size-4" />
                Contact Admin
              </button>
            )}

            <Link
              href={`/client/projects/new?service=${activeTab}`}
              className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-6 py-3 text-[14px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="size-4" />
              {activeTab === "playstore"
                ? "Start Closed Test"
                : activeTab === "ios"
                ? "Create iOS Project"
                : "Create UX Project"}
            </Link>
          </div>
        </div>

        {/* Empty State or Project List */}
        {activeProjects.length === 0 ? (
          <div className="py-14 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-zinc-100 text-ink-400">
              {activeTab === "playstore" ? (
                <Smartphone className="size-8" />
              ) : activeTab === "ios" ? (
                <Apple className="size-8" />
              ) : (
                <Sparkles className="size-8" />
              )}
            </div>
            <h5 className="mt-4 text-[18px] font-semibold text-ink-950">
              {activeTab === "playstore"
                ? "No Android closed tests yet"
                : activeTab === "ios"
                ? "No iOS projects yet"
                : "No UX testing projects yet"}
            </h5>
            <p className="mx-auto mt-1.5 max-w-md text-[14px] leading-relaxed text-ink-500">
              {activeTab === "playstore"
                ? "Get 14 real Android testers on physical devices for 14 continuous days to meet Google Play requirements."
                : activeTab === "ios"
                ? "Ready to test your iOS app? You can create an iOS project or contact the admin directly to coordinate TestFlight testers."
                : "Want real usability insights and friction reports? Set up a UX testing study or message the admin directly."}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {activeTab !== "playstore" && (
                <button
                  type="button"
                  onClick={() => openContactModal(activeTab)}
                  className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-6 py-3 text-[14.5px] font-semibold text-ink-800 transition-colors hover:bg-black/5"
                >
                  <MessageSquare className="size-4" />
                  Contact Admin for {activeTab.toUpperCase()}
                </button>
              )}
              <Link
                href={`/client/projects/new?service=${activeTab}`}
                className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-7 py-3 text-[14.5px] font-semibold text-white transition-transform hover:scale-[1.02]"
              >
                <Plus className="size-4" />
                {activeTab === "playstore"
                  ? "Start Android Test"
                  : activeTab === "ios"
                  ? "Create iOS Project"
                  : "Create UX Project"}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {activeProjects.map((p) => (
              <Link
                key={p._id}
                href={`/client/projects/${p._id}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-black/5 bg-zinc-50/50 p-5 transition-all hover:bg-white hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="truncate text-[16.5px] font-bold text-ink-950">
                    {p.appDetails.appName}
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink-400">
                    {p.appDetails.packageName} · Created {formatDate(p.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[13px] font-medium text-ink-500">
                    {p.activeTesterCount}/{p.requiredTesters} testers
                  </span>
                  <StatusPill status={p.status} />
                  <ArrowRight className="size-4 text-ink-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Contact Admin Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-[28px] border border-black/10 bg-white p-7 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-black/8">
              <div className="flex items-center gap-2.5">
                <span className="grid size-10 place-items-center rounded-2xl bg-zinc-100 text-ink-950">
                  <MessageSquare className="size-5" />
                </span>
                <div>
                  <h4 className="text-[17px] font-bold text-ink-950">
                    Contact Admin
                  </h4>
                  <p className="text-[12.5px] text-ink-500">
                    Direct message to the admin team for {activeTab === "ios" ? "iOS TestFlight" : "UX Testing"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="grid size-9 place-items-center rounded-full text-ink-400 hover:bg-black/5 hover:text-ink-950"
              >
                <X className="size-4" />
              </button>
            </div>

            {sentSuccess ? (
              <div className="py-8 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="size-6" />
                </span>
                <h5 className="mt-3 text-[17px] font-bold text-ink-950">Message Sent!</h5>
                <p className="mt-1 text-[13.5px] text-ink-600">
                  The admin has received your request and will follow up shortly. You can also view it in your Support tab.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendContact} className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1 block text-[13px] font-semibold text-ink-800">
                    Subject
                  </span>
                  <input
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-black/10 px-4 py-2.5 text-[14px] outline-none focus:border-ink-950"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[13px] font-semibold text-ink-800">
                    Tell us about your app & requirements *
                  </span>
                  <textarea
                    rows={4}
                    value={contactBody}
                    onChange={(e) => setContactBody(e.target.value)}
                    required
                    placeholder={
                      activeTab === "ios"
                        ? "App name, TestFlight link (if available), number of testers needed, target launch date..."
                        : "App or prototype link, key user flows to test, type of feedback desired..."
                    }
                    className="w-full rounded-2xl border border-black/10 p-4 text-[14px] outline-none placeholder:text-ink-400 focus:border-ink-950"
                  />
                </label>

                {contactError && (
                  <p className="rounded-xl bg-rose-500/10 px-4 py-2.5 text-[13px] text-rose-600">
                    {contactError}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-full border border-black/10 px-5 py-2.5 text-[13.5px] font-semibold text-ink-700 hover:bg-black/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending || !contactBody.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-6 py-2.5 text-[13.5px] font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-40"
                  >
                    {sending ? "Sending..." : "Send Request"}
                    <Send className="size-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
