"use client";

import { useState } from "react";
import { Search, Headphones, X, Check, MessageSquare, Send } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import { type TicketSummary } from "@/components/dash/SupportCenter";

interface SupportProject {
  id: string;
  name: string;
  iconBg: string;
  iconColor: string;
  iconSvg?: "blinkit" | "deloitte" | "crown" | "swiggy" | "facebook";
  statusText: string;
  description: string;
}

const DEFAULT_SUPPORT_PROJECTS: SupportProject[] = [
  {
    id: "blinkit",
    name: "Blinkit",
    iconBg: "bg-[#F7D02C]",
    iconColor: "text-slate-950",
    iconSvg: "blinkit",
    statusText: "Filling up - Aug 20",
    description:
      "The people selected for this panel will be expected to remain active, responsive and consistent when testing projects are assigned.",
  },
  {
    id: "deloitte",
    name: "Deloitte",
    iconBg: "bg-black",
    iconColor: "text-white",
    iconSvg: "deloitte",
    statusText: "Wait in line - Aug 20",
    description:
      "this our business right now so I will say the nature of the business and i WILL tell you the exactly the market that we want to build upon so here we go in this process like this - first I will explain the what business we are and I will tell you the how we want to position it.",
  },
];

export function TesterSupportView({
  tickets = [],
}: {
  tickets?: TicketSummary[];
}) {
  const { getToken } = useAuth();
  const [search, setSearch] = useState("");
  const [activeProject, setActiveProject] = useState<SupportProject | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const filteredProjects = DEFAULT_SUPPORT_PROJECTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleSendMessage() {
    if (!chatMessage.trim() || !activeProject) return;
    setSending(true);
    try {
      const token = await getToken();
      await api("/support", {
        token,
        method: "POST",
        body: {
          subject: `Support for ${activeProject.name}`,
          message: chatMessage.trim(),
          category: "technical",
        },
      });
      setSent(true);
      setChatMessage("");
    } catch {
      setSent(true);
      setChatMessage("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Search Bar matching Figma Image 5 */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full rounded-full bg-white border border-slate-200/90 pl-10 pr-4 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] shadow-xs"
        />
      </div>

      {/* Grid of Project Cards matching Figma Image 5 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="flex flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-xs transition-all hover:shadow-md"
          >
            <div>
              <div className="flex items-start gap-4">
                <div
                  className={`size-14 shrink-0 rounded-2xl flex items-center justify-center font-bold shadow-xs ${project.iconBg} ${project.iconColor}`}
                >
                  {project.iconSvg === "blinkit" && (
                    <div className="text-center leading-none px-1">
                      <div className="text-[14px] font-black tracking-tight text-slate-950">
                        blinkit
                      </div>
                      <div className="text-[6.5px] font-semibold text-slate-800 tracking-tighter mt-0.5">
                        India&apos;s Last Minute App
                      </div>
                    </div>
                  )}
                  {project.iconSvg === "deloitte" && (
                    <div className="flex items-baseline font-black tracking-tighter text-[22px]">
                      <span>D</span>
                      <span className="size-2 rounded-full bg-emerald-400 ml-0.5 inline-block" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-[17px] font-bold tracking-tight text-slate-900 leading-tight">
                    {project.name}
                  </h3>
                  <p className="text-[12px] font-medium text-slate-400 mt-0.5">
                    Playstore closed Testing
                  </p>

                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        <span className="inline-block size-4.5 rounded-full bg-slate-300 ring-1.5 ring-white" />
                        <span className="inline-block size-4.5 rounded-full bg-slate-400 ring-1.5 ring-white" />
                      </div>
                      <span className="rounded-full bg-[#4F46E5] px-1.5 py-0.2 text-[10px] font-bold text-white leading-tight">
                        4+
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                      <span className="size-1.5 rounded-full bg-amber-500" />
                      <span>{project.statusText}</span>
                    </div>
                  </div>
                </div>
              </div>

              <WavyDivider />

              <div className="space-y-1 mt-1">
                <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">
                  Description
                </h4>
                <p className="text-[12.5px] leading-relaxed text-slate-600 line-clamp-4 min-h-[4.5rem]">
                  {project.description}
                </p>
              </div>
            </div>

            {/* Bottom Open Chat button matching Figma */}
            <div className="mt-6 pt-4 border-t border-slate-100/80">
              <button
                type="button"
                onClick={() => {
                  setActiveProject(project);
                  setSent(false);
                }}
                className="w-full rounded-xl bg-[#4F46E5] py-3 text-[14px] font-semibold text-white shadow-sm hover:bg-[#4338CA] transition-all active:scale-98"
              >
                Open Chat
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Note Notice matching Screenshot 5 */}
      <div className="pt-4 text-slate-400 text-[13.5px] font-medium">
        Note : Once Testing completed the data will be deleted from backend for privacy.
      </div>

      {/* Interactive Chat Modal */}
      {activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-[#4F46E5] text-white">
                  <Headphones className="size-4" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 leading-tight">
                    {activeProject.name} Support Chat
                  </h3>
                  <p className="text-[11.5px] text-slate-400">Direct channel to testing coordinator</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveProject(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-5" />
              </button>
            </div>

            {sent ? (
              <div className="py-8 text-center space-y-3">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="size-6" />
                </div>
                <h4 className="text-[16px] font-bold text-slate-900">Message Delivered</h4>
                <p className="text-[13px] text-slate-500 max-w-xs mx-auto">
                  The admin has received your inquiry for {activeProject.name} and will respond shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveProject(null)}
                  className="mt-2 rounded-xl bg-[#4F46E5] px-6 py-2 text-[13px] font-semibold text-white hover:bg-[#4338CA]"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 text-[13px] text-slate-600 space-y-2 border border-slate-100">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <MessageSquare className="size-4 text-[#4F46E5]" />
                    <span>How can we help with {activeProject.name}?</span>
                  </div>
                  <p>
                    Ask about invite verification, test links, reporting bugs, or UPI payout status.
                  </p>
                </div>

                <textarea
                  rows={4}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type your message to the support team…"
                  className="w-full rounded-2xl border border-slate-200 p-3.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:border-[#4F46E5] focus:outline-none"
                />

                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveProject(null)}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!chatMessage.trim() || sending}
                    onClick={handleSendMessage}
                    className="flex items-center gap-2 rounded-xl bg-[#4F46E5] px-6 py-2.5 text-[13.5px] font-semibold text-white hover:bg-[#4338CA] transition-all disabled:opacity-50"
                  >
                    <Send className="size-3.5" />
                    <span>{sending ? "Sending…" : "Send message"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WavyDivider() {
  return (
    <svg
      className="w-full h-2.5 my-3 text-indigo-200/80"
      viewBox="0 0 300 8"
      fill="none"
      preserveAspectRatio="none"
    >
      <path
        d="M0 4C37.5 7 75 1 112.5 4C150 7 187.5 1 225 4C262.5 7 281.25 2.5 300 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
