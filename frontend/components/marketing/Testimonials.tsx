"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

/* ── Types ── */
interface SenjaTestimonial {
  id: string;
  content: string;
  rating?: number;
  author_name?: string;
  author_title?: string;
  author_avatar?: string;
  source?: string;
}

async function getTestimonials(): Promise<SenjaTestimonial[]> {
  try {
    const res = await fetch("/api/testimonials");
    if (!res.ok) return [];
    const list = await res.json();
    return Array.isArray(list) ? list.slice(0, 9) : [];
  } catch {
    return [];
  }
}

/* ── Star row ── */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-4 ${
            i < rating
              ? "fill-orange-500 text-orange-500"
              : "fill-ink-100 text-ink-100"
          }`}
        />
      ))}
    </div>
  );
}

/* ── Avatar initials fallback ── */
function Avatar({
  name,
  src,
}: {
  name?: string;
  src?: string;
}) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "reviewer"}
        className="size-10 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="grid size-10 place-items-center rounded-full bg-cream-100 text-[14px] font-bold text-ink-950">
      {initials}
    </span>
  );
}

/* ── Card ── */
function TestimonialCard({ t }: { t: SenjaTestimonial }) {
  return (
    <div className="flex h-full flex-col rounded-card border border-black/5 bg-white p-6 shadow-card">
      <Stars rating={t.rating ?? 5} />
      <p className="mt-4 flex-1 text-[15px] leading-relaxed text-ink-700">
        &ldquo;{t.content}&rdquo;
      </p>
      <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-4">
        <Avatar name={t.author_name} src={t.author_avatar} />
        <div>
          <p className="text-[14px] font-semibold text-ink-950">
            {t.author_name ?? "Anonymous"}
          </p>
          {t.author_title && (
            <p className="text-[12.5px] text-ink-400">{t.author_title}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Section Component ── */
export function Testimonials() {
  const [testimonials, setTestimonials] = useState<SenjaTestimonial[]>([]);

  useEffect(() => {
    getTestimonials().then((res) => {
      if (res && res.length > 0) setTestimonials(res);
    }).catch(() => {});
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <section className="bg-paper py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* header */}
        <div className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange-500">
            Testimonials
          </p>
          <h2 className="mt-2 text-[clamp(2rem,4.5vw,3.2rem)] font-semibold tracking-display text-ink-950">
            What clients say after testing with us.
          </h2>
        </div>

        {/* masonry-style 3-col grid */}
        <div className="mt-14 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {testimonials.map((t) => (
            <div key={t.id} className="mb-5 break-inside-avoid">
              <TestimonialCard t={t} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
