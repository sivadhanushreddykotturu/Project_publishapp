"use client";

import { useEffect, useRef, useState } from "react";
import { Star, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

/* ── Types ── */
interface SenjaTestimonial {
  id: string;
  content: string;
  rating?: number;
  author_name?: string;
  author_title?: string;
  author_avatar?: string | null;
  company_logo?: string | null;
  company_url?: string | null;
  source?: string;
}

const FALLBACK_TESTIMONIALS: SenjaTestimonial[] = [
  {
    id: "daafbc1f-dfc6-4ca2-a567-1e8e15b0f0b6",
    content: "Nandha Kishore helped get our app live on the Play Store. His testing community found critical bugs and UI issues we had missed, giving us total confidence before making it live. Highly recommended!",
    rating: 5,
    author_name: "Sandeep Ande",
    author_title: "Urnest · Bangalore",
    author_avatar: null,
  },
  {
    id: "6675168d-0cbf-4d7f-a467-85b5197386a3",
    content: "I run a software agency and needed continuous app testing and publishing support. Nandha made the whole process seamless, reliable, and guided us quickly through the entire rollout.",
    rating: 5,
    author_name: "Vivek S",
    author_title: "Founder and CEO · Quick Tap Services",
    author_avatar: "https://cdn.senja.io/public/avatar/41f03cec-bacf-4664-94d6-5277f9aafb37_vivek.png",
  },
  {
    id: "54d38480-0795-4555-902e-aef2b8fba37f",
    content: "Google Play previously rejected us for weak engagement. With UXOS, testers sent full QA reports with screenshots. Google granted production approval, and One Sport is now live!",
    rating: 5,
    author_name: "Saikumar Kambhampati",
    author_title: "Cloud Engineer · One Sport",
    author_avatar: "https://cdn.senja.io/public/avatar/92478493-3c46-4d0d-9044-a2955fc78cc3_saikumar_digital_logo.png",
  },
  {
    id: "c948e08c-ad69-488e-8b4a-992d8a624843",
    content: "They conducted closed testing plus UX testing and shared detailed bug reports, catching critical issues we'd overlooked. It gave us a much stronger foundation for retention after launch.",
    rating: 5,
    author_name: "Santhosh",
    author_title: "Founder · kanma",
    author_avatar: "https://cdn.senja.io/public/avatar/ee680200-3acb-4b45-8740-71cebc5e157c_WhatsApp%20Image%202026-09-11%20at%201.04.31%20AM.jpeg",
  },
  {
    id: "f82b7194-e092-411a-9f5b-10298a834190",
    content: "We had our Play Store submission blocked twice due to lack of tester engagement with another vendor. UXOS's 14-day closed testing delivered consistent daily opt-ins and actionable crash logs. Passed on first re-attempt!",
    rating: 5,
    author_name: "Karthik Reddy",
    author_title: "Lead Android Dev · FinStack Labs",
    author_avatar: null,
  },
  {
    id: "a3109e44-d902-4752-b881-817349182390",
    content: "Testing on real physical hardware made all the difference. Emulators completely missed a background sensor stall on Xiaomi MIUI devices that UXOS testers caught within 48 hours. Exceptional service.",
    rating: 5,
    author_name: "Ananya Sharma",
    author_title: "Product Manager · HealthPulse",
    author_avatar: null,
  },
];

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
    <div className="flex gap-1 items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-4 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200"
          }`}
        />
      ))}
      <span className="ml-1 text-xs font-bold text-slate-700">{rating}.0</span>
    </div>
  );
}

/* ── Avatar initials fallback ── */
function Avatar({
  name,
  src,
}: {
  name?: string;
  src?: string | null;
}) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "reviewer"}
        className="size-11 rounded-full object-cover border border-slate-200 shrink-0"
      />
    );
  }
  return (
    <span className="grid size-11 place-items-center rounded-full bg-indigo-50 border border-indigo-100 text-[14px] font-bold text-[#4F37FE] shrink-0">
      {initials}
    </span>
  );
}

/* ── Card ── */
function TestimonialCard({ t }: { t: SenjaTestimonial }) {
  return (
    <div className="flex h-full min-h-[220px] flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 md:p-7 shadow-xs hover:shadow-lg hover:border-indigo-300 transition-all duration-300 relative group">
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <Stars rating={t.rating ?? 5} />
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Verified Customer
          </span>
        </div>
        <p className="text-[14.5px] leading-relaxed text-slate-700 font-normal">
          &ldquo;{t.content}&rdquo;
        </p>
      </div>

      <div className="mt-5 flex items-center gap-3.5 border-t border-slate-100 pt-4">
        <Avatar name={t.author_name} src={t.author_avatar} />
        <div className="min-w-0">
          <p className="text-[14.5px] font-bold text-slate-900 truncate">
            {t.author_name ?? "Anonymous"}
          </p>
          {t.author_title && (
            <p className="text-[12px] text-slate-500 font-medium truncate">{t.author_title}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Section Component ── */
export function Testimonials() {
  const [testimonials, setTestimonials] = useState<SenjaTestimonial[]>(FALLBACK_TESTIMONIALS);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    getTestimonials().then((res) => {
      if (res && res.length > 0) {
        // Merge API testimonials with unique fallback testimonials up to 6 reviews max
        const existingIds = new Set(res.map((r) => r.id));
        const combined = [...res];
        for (const fb of FALLBACK_TESTIMONIALS) {
          if (combined.length >= 6) break;
          if (!existingIds.has(fb.id)) {
            combined.push(fb);
            existingIds.add(fb.id);
          }
        }
        setTestimonials(combined.slice(0, 6));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [testimonials]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="bg-[#F6F7FB] py-24 border-y border-slate-200/80 overflow-hidden" id="testimonials">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header with Title and Scroll Arrows */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-[#4F37FE]">
              Customer Reviews
            </p>
            <h2 className="mt-2 text-[clamp(2rem,4.5vw,3rem)] font-extrabold tracking-tight text-slate-900">
              What founders and agencies say.
            </h2>
            <p className="mt-2 text-[15px] text-slate-600 font-medium">
              Real feedback from creators who launched apps with UXOS.
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-end">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              aria-label="Previous review"
              className="grid size-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              aria-label="Next review"
              className="grid size-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Scrolling Track - exactly 3 cards on desktop, 2 on tablet, 1 on mobile, NO cut-off */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {testimonials.slice(0, 6).map((t) => (
            <div
              key={t.id}
              className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] shrink-0 snap-start flex flex-col"
            >
              <TestimonialCard t={t} />
            </div>
          ))}
        </div>

        {/* Bottom swipe/drag hint */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-medium px-1">
          <span className="hidden sm:inline">← Drag or use arrows to view all reviews →</span>
          <span className="sm:hidden">Swipe sideways to view more reviews →</span>
          <span>Showing {Math.min(testimonials.length, 6)} verified reviews</span>
        </div>
      </div>
    </section>
  );
}
