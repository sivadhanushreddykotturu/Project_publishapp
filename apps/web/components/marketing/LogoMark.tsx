export function LogoMark({ size = 34 }: { size?: number }) {
  // 3x3 app-grid tile, center cell in lime — DefineUX' launchpad glyph
  const cells = Array.from({ length: 9 });
  return (
    <span
      className="inline-grid grid-cols-3 place-items-center rounded-[28%] bg-ink-950"
      style={{ width: size, height: size, padding: size * 0.16, gap: size * 0.06 }}
      aria-hidden
    >
      {cells.map((_, i) => (
        <span
          key={i}
          className={i === 4 ? "rounded-[30%] bg-lime-400" : "rounded-[30%] bg-white"}
          style={{ width: size * 0.16, height: size * 0.16 }}
        />
      ))}
    </span>
  );
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span
        className={`text-[19px] font-semibold tracking-tight ${
          dark ? "text-white" : "text-ink-950"
        }`}
      >
        DefineUX
      </span>
    </span>
  );
}
