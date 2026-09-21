"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Headphones,
  X,
  MessageSquare,
  Send,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import { type TesterAssignment } from "./AssignmentCard";

export interface TesterSupportTicket {
  _id: string;
  projectId?: {
    _id: string;
    appDetails?: { appName: string; packageName: string };
  } | string;
  subject: string;
  status: "open" | "in_progress" | "resolved";
  messages: Array<{
    _id?: string;
    senderId: string;
    isAdmin: boolean;
    body: string;
    at: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface SupportProjectItem {
  id: string;
  projectId?: string;
  name: string;
  packageName?: string;
  iconBg: string;
  iconColor: string;
  iconSvg?: "blinkit" | "deloitte" | "crown" | "swiggy" | "facebook" | "general";
  statusText: string;
  statusType: "active" | "wait" | "general";
  description: string;
  ticket?: TesterSupportTicket;
  hasUnreadReply?: boolean;
}

export function TesterSupportView({
  assignments = [],
  initialTickets = [],
}: {
  assignments?: TesterAssignment[];
  initialTickets?: TesterSupportTicket[];
}) {
  const { getToken, userId } = useAuth();
  const [search, setSearch] = useState("");
  const [tickets, setTickets] = useState<TesterSupportTicket[]>(initialTickets);
  const [activeProject, setActiveProject] = useState<SupportProjectItem | null>(null);

  // Active chat state
  const [activeTicket, setActiveTicket] = useState<TesterSupportTicket | null>(null);
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      senderId: string;
      isAdmin: boolean;
      body: string;
      at: string;
      sending?: boolean;
    }>
  >([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Build dynamic project list from real assignments + general support card
  const projectItems: SupportProjectItem[] = (() => {
    const list: SupportProjectItem[] = [];

    // General platform support card
    const generalTicket = tickets.find((t) => !t.projectId || typeof t.projectId === "string");
    const generalHasUnread =
      generalTicket?.messages?.length &&
      generalTicket.messages[generalTicket.messages.length - 1].isAdmin;

    list.push({
      id: "general-support",
      name: "Platform & UPI Support",
      iconBg: "bg-indigo-600",
      iconColor: "text-white",
      iconSvg: "general",
      statusText: "24/7 Fast Response",
      statusType: "general",
      description:
        "General inquiries regarding your tester profile, device registrations, verification rules, or UPI wallet payouts.",
      ticket: generalTicket,
      hasUnreadReply: Boolean(generalHasUnread),
    });

    if (assignments && assignments.length > 0) {
      const bgColors = ["bg-[#F7D02C]", "bg-black", "bg-[#7F0E1E]", "bg-[#1877F2]"];
      assignments.forEach((a, idx) => {
        const p = a.projectId;
        const appName = p?.appDetails?.appName || "Android App";
        const lower = appName.toLowerCase();
        const iconSvg = lower.includes("blinkit")
          ? ("blinkit" as const)
          : lower.includes("swiggy")
          ? ("swiggy" as const)
          : lower.includes("deloitte")
          ? ("deloitte" as const)
          : lower.includes("kanma")
          ? ("crown" as const)
          : undefined;

        // Match existing ticket for this project
        const projectTicket = tickets.find((t) => {
          if (!t.projectId) return false;
          if (typeof t.projectId === "object" && t.projectId._id) {
            return t.projectId._id === p?._id;
          }
          return t.projectId === p?._id;
        });

        const hasUnreadReply =
          projectTicket?.messages?.length &&
          projectTicket.messages[projectTicket.messages.length - 1].isAdmin;

        list.push({
          id: a._id,
          projectId: p?._id,
          name: appName,
          packageName: p?.appDetails?.packageName,
          iconBg: bgColors[idx % bgColors.length],
          iconColor: idx % bgColors.length === 0 ? "text-slate-950" : "text-white",
          iconSvg,
          statusText: a.status === "queued" ? `Queued #${a.queuePosition || 1}` : `Step ${a.currentStep || 1} Active`,
          statusType: a.status === "queued" ? "wait" : "active",
          description:
            (p?.appDetails as { description?: string } | undefined)?.description ||
            "Play Store closed testing track. Open chat for assistance with invitation links, installation errors, or verification.",
          ticket: projectTicket,
          hasUnreadReply: Boolean(hasUnreadReply),
        });
      });
    }

    return list;
  })();

  const filteredProjects = projectItems.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      (p.packageName && p.packageName.toLowerCase().includes(search.toLowerCase())),
  );

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // When activeProject changes, load or initialize the ticket conversation
  useEffect(() => {
    if (!activeProject) {
      setActiveTicket(null);
      setMessages([]);
      return;
    }

    const existingTicket = activeProject.ticket;
    if (existingTicket) {
      setActiveTicket(existingTicket);
      setMessages(
        (existingTicket.messages || []).map((m, idx) => ({
          id: m._id || `m-${idx}`,
          senderId: m.senderId,
          isAdmin: m.isAdmin,
          body: m.body,
          at: m.at,
        })),
      );
    } else {
      setActiveTicket(null);
      setMessages([]);
    }
  }, [activeProject]);

  // Polling for live ticket updates while drawer is open
  useEffect(() => {
    if (!activeProject || !activeTicket?._id) return;

    const interval = setInterval(async () => {
      try {
        const token = await getToken();
        const res = await api<{ ticket: TesterSupportTicket }>(
          `/support-tickets/${activeTicket._id}`,
          { token },
        );
        if (res?.ticket?.messages) {
          setMessages(
            res.ticket.messages.map((m, idx) => ({
              id: m._id || `m-${idx}`,
              senderId: m.senderId,
              isAdmin: m.isAdmin,
              body: m.body,
              at: m.at,
            })),
          );
          setActiveTicket(res.ticket);
        }
      } catch {
        // Silently ignore background poll error
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [activeProject, activeTicket?._id, getToken]);

  // Send message
  async function handleSendMessage(textOverride?: string) {
    const textToSend = (textOverride || inputMessage).trim();
    if (!textToSend || !activeProject || sending) return;

    setSending(true);
    setInputMessage("");

    // Optimistic UI message addition
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      senderId: userId || "me",
      isAdmin: false,
      body: textToSend,
      at: new Date().toISOString(),
      sending: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const token = await getToken();

      if (activeTicket?._id) {
        // Reply to existing ticket thread
        await api(`/support-tickets/${activeTicket._id}/messages`, {
          token,
          method: "POST",
          body: { body: textToSend },
        });

        // Update local status
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, sending: false } : m)),
        );
      } else {
        // Create new ticket for this project
        const createRes = await api<{ ticket: TesterSupportTicket }>("/support-tickets", {
          token,
          method: "POST",
          body: {
            subject: `Support: ${activeProject.name}`,
            body: textToSend,
            projectId: activeProject.projectId,
          },
        });

        if (createRes?.ticket) {
          setActiveTicket(createRes.ticket);
          setTickets((prev) => [createRes.ticket, ...prev]);
          setMessages(
            createRes.ticket.messages.map((m, idx) => ({
              id: m._id || `m-${idx}`,
              senderId: m.senderId,
              isAdmin: m.isAdmin,
              body: m.body,
              at: m.at,
            })),
          );
        }
      }
    } catch {
      // Keep optimistic message with error indication
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, sending: false } : m)),
      );
    } finally {
      setSending(false);
    }
  }

  // Quick chips definitions
  const quickSuggestions = [
    "Can't access Play Store opt-in link",
    "App crashes when opened",
    "When will Step 2 unlock?",
    "UPI payout withdrawal inquiry",
  ];

  return (
    <div className="space-y-8">
      {/* Top Header & Search Bar matching Figma Image 5 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search apps or support channels..."
            className="w-full rounded-full bg-white border border-slate-200/90 pl-10 pr-4 py-2.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-[12.5px] font-semibold text-slate-500 bg-white border border-slate-200/80 px-4 py-2 rounded-full shadow-xs">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Admin Support Online · Instant Reply</span>
        </div>
      </div>

      {/* Grid of Project Cards matching Figma Image 5 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className={`flex flex-col justify-between rounded-[24px] border bg-white p-6 shadow-xs transition-all hover:shadow-md ${
              project.hasUnreadReply
                ? "border-indigo-400 ring-2 ring-indigo-50"
                : "border-slate-200/80"
            }`}
          >
            <div>
              <div className="flex items-start gap-4">
                <div
                  className={`size-14 shrink-0 rounded-2xl flex items-center justify-center font-bold shadow-xs ${project.iconBg} ${project.iconColor}`}
                >
                  <AppGlyph item={project} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-[17px] font-bold tracking-tight text-slate-900 leading-tight truncate">
                      {project.name}
                    </h3>
                    {project.hasUnreadReply && (
                      <span className="shrink-0 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider animate-bounce">
                        New Reply
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] font-medium text-slate-400 mt-0.5 font-mono truncate">
                    {project.packageName || "Playstore closed Testing"}
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
                      <span
                        className={`size-1.5 rounded-full ${
                          project.statusType === "general"
                            ? "bg-emerald-500"
                            : project.statusType === "active"
                            ? "bg-indigo-500"
                            : "bg-amber-500"
                        }`}
                      />
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
                <p className="text-[12.5px] leading-relaxed text-slate-600 line-clamp-3 min-h-[3.5rem]">
                  {project.description}
                </p>
              </div>
            </div>

            {/* Bottom Open Chat button */}
            <div className="mt-6 pt-4 border-t border-slate-100/80">
              <button
                type="button"
                onClick={() => setActiveProject(project)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4F46E5] py-3 text-[14px] font-semibold text-white shadow-xs hover:bg-[#4338CA] transition-all active:scale-[0.99] cursor-pointer"
              >
                <MessageSquare className="size-4" />
                <span>Open Chat</span>
                {project.hasUnreadReply && (
                  <span className="size-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Note Notice matching Screenshot 5 */}
      <div className="pt-4 text-slate-400 text-[13.5px] font-medium">
        Note : Once Testing completed the data will be deleted from backend for privacy.
      </div>

      {/* INTERACTIVE MESSENGER SLIDE-OVER DRAWER */}
      {activeProject && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200/90 px-6 py-4 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div
                  className={`size-10 rounded-xl flex items-center justify-center font-bold shadow-xs ${activeProject.iconBg} ${activeProject.iconColor}`}
                >
                  <AppGlyph item={activeProject} small />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 leading-tight">
                    {activeProject.name} Support
                  </h3>
                  <p className="text-[11.5px] text-emerald-600 font-medium flex items-center gap-1.5 mt-0.5">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Admin Support · Live Channel
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveProject(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Drawer Message Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F8FAFC]">
              {/* Welcome Card */}
              <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-[13.5px] font-bold text-slate-900">
                  <Sparkles className="size-4 text-[#4F46E5]" />
                  <span>Welcome to {activeProject.name} Support</span>
                </div>
                <p className="text-[12.5px] text-slate-600 leading-relaxed">
                  Have a question about Google Play Console invites, app verification proofs, or your testing timeline? Message us directly below. Our admin team monitors this channel continuously.
                </p>
              </div>

              {/* Messages list */}
              {messages.map((msg) => {
                const isMe = !msg.isAdmin;
                const timeFormatted = new Date(msg.at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    {!isMe && (
                      <span className="text-[11px] font-bold text-[#4F46E5] uppercase tracking-wider mb-1 px-1">
                        Admin Support
                      </span>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed shadow-xs ${
                        isMe
                          ? "bg-[#4F46E5] text-white rounded-tr-xs"
                          : "bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs"
                      } ${msg.sending ? "opacity-70" : ""}`}
                    >
                      <p className="whitespace-pre-wrap">{msg.body}</p>
                    </div>

                    <div className="flex items-center gap-1 text-[10.5px] text-slate-400 mt-1 px-1">
                      <span>{timeFormatted}</span>
                      {isMe && (
                        <span>{msg.sending ? "· sending…" : "✓"}</span>
                      )}
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Chips */}
            <div className="border-t border-slate-100 bg-white px-5 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Quick Prompts:
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {quickSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(suggestion)}
                    className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-[#4F46E5] transition-all cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input Bar */}
            <div className="border-t border-slate-200 bg-white p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Message support about ${activeProject.name}…`}
                  className="flex-1 rounded-2xl border border-slate-200/90 bg-slate-50/70 px-4 py-3 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#4F46E5] focus:bg-white transition-colors"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || sending}
                  className="flex size-11 items-center justify-center rounded-2xl bg-[#4F46E5] text-white shadow-xs hover:bg-[#4338CA] transition-all active:scale-95 disabled:opacity-40 shrink-0 cursor-pointer"
                >
                  <Send className="size-4" />
                </button>
              </form>
            </div>
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

function AppGlyph({ item, small = false }: { item: SupportProjectItem; small?: boolean }) {
  if (item.iconSvg === "general") {
    return <Headphones className={small ? "size-5 text-white" : "size-7 text-white"} />;
  }
  if (item.iconSvg === "crown") {
    return (
      <svg className={small ? "size-5 fill-current" : "size-7 fill-current"} viewBox="0 0 24 24">
        <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" />
      </svg>
    );
  }
  if (item.iconSvg === "deloitte") {
    return (
      <div className={`flex items-baseline font-black tracking-tighter ${small ? "text-[16px]" : "text-[22px]"}`}>
        <span>D</span>
        <span className="size-2 rounded-full bg-emerald-400 ml-0.5 inline-block" />
      </div>
    );
  }
  if (item.iconSvg === "blinkit") {
    return (
      <div className="text-center leading-none px-1">
        <div className={small ? "text-[11px] font-black" : "text-[14px] font-black tracking-tight"}>
          blinkit
        </div>
      </div>
    );
  }
  if (item.iconSvg === "swiggy") {
    return (
      <svg className={small ? "size-5 fill-current" : "size-7 fill-current"} viewBox="0 0 24 24">
        <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
      </svg>
    );
  }
  return <span>{item.name.slice(0, 2).toUpperCase()}</span>;
}
