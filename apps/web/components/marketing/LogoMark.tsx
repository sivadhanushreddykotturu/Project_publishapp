export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-[28%] bg-ink-950 shadow-sm transition-transform hover:scale-105"
      style={{ width: size, height: size, padding: size * 0.16 }}
      aria-hidden
    >
      <img
        src="/logo-white-glyph.png"
        alt="UXOS logo mark"
        className="h-full w-full object-contain"
      />
    </span>
  );
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span
        className={`text-[19px] font-bold tracking-tight ${
          dark ? "text-white" : "text-ink-950"
        }`}
      >
        UXOS
      </span>
    </span>
  );
}
