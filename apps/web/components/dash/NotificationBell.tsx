"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";

interface InAppNotification {
  _id: string;
  type: string;
  payload: { title: string; body: string; link?: string };
  readAt?: string;
  createdAt: string;
}

export function NotificationBell({ variant = "default" }: { variant?: "default" | "purple" }) {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const token = await getToken();
      const data = await api<{ notifications: InAppNotification[]; unread: number }>(
        "/notifications/me",
        { token },
      );
      setItems(data.notifications);
      setUnread(data.unread);
    } catch {
      /* bell stays quiet on error */
    }
  }

  useEffect(() => {
    void load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markRead(n: InAppNotification) {
    if (n.readAt) return;
    const token = await getToken();
    await api(`/notifications/${n._id}/read`, { token, method: "PATCH" }).catch(
      () => {},
    );
    setItems((xs) => xs.map((x) => (x._id === n._id ? { ...x, readAt: "now" } : x)));
    setUnread((u) => Math.max(0, u - 1));
  }

  return (
    <div ref={ref} className="relative">
      <button
        aria-label="Notifications"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) void load();
        }}
        className={`relative grid size-10 place-items-center rounded-full transition-all ${
          variant === "purple"
            ? "bg-[#4F46E5] text-white shadow-sm hover:bg-[#4338CA]"
            : "border border-black/5 bg-white text-ink-800 hover:border-black/15"
        }`}
      >
        <Bell className="size-[18px]" strokeWidth={2} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-size-5 place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[360px] overflow-hidden rounded-[20px] border border-black/5 bg-white shadow-xl">
          <p className="border-b border-black/5 px-5 py-3.5 text-[13px] font-semibold text-ink-950">
            Notifications
          </p>
          <div className="max-h-[380px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-ink-400">
                Nothing yet — we&apos;ll keep you posted.
              </p>
            ) : (
              items.map((n) => {
                const body = (
                  <div
                    className={`border-b border-black/5 px-5 py-4 last:border-0 ${
                      n.readAt ? "opacity-60" : "bg-lime-200/20"
                    }`}
                  >
                    <p className="text-[13.5px] font-semibold text-ink-950">
                      {n.payload.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-ink-500">
                      {n.payload.body}
                    </p>
                  </div>
                );
                return n.payload.link ? (
                  <Link
                    key={n._id}
                    href={n.payload.link}
                    onClick={() => {
                      void markRead(n);
                      setOpen(false);
                    }}
                    className="block transition-colors hover:bg-paper"
                  >
                    {body}
                  </Link>
                ) : (
                  <button
                    key={n._id}
                    onClick={() => void markRead(n)}
                    className="block w-full text-left"
                  >
                    {body}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
