const REASONS = [
  "They couldn't understand a screen",
  "A flow was confusing",
  "Something didn't work as expected",
  "The onboarding experience was poor",
  "A feature felt difficult to use",
  "A bug interrupted their journey",
];

export function Problem() {
  return (
    <section className="bg-paper py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange-500">
          The problem
        </p>
        <h2 className="mt-2 text-[clamp(2rem,4.5vw,3.2rem)] font-semibold tracking-display text-ink-950">
          Your first 100 users shouldn&apos;t be your testers.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[16px] text-ink-600">
          Launching and waiting for users to report problems is expensive. A
          user may leave because:
        </p>

        <ul className="mt-10 flex flex-wrap justify-center gap-3">
          {REASONS.map((r) => (
            <li
              key={r}
              className="rounded-full border border-black/5 bg-white px-4 py-2 text-[14px] font-medium text-ink-800 shadow-card"
            >
              {r}
            </li>
          ))}
        </ul>

        <p className="mt-10 text-[16px] text-ink-600">
          By the time you discover the problem, you&apos;ve already lost the
          user.
        </p>
        <p className="mt-2 text-[20px] font-semibold text-ink-950">
          Test first. Launch with confidence.
        </p>
      </div>
    </section>
  );
}
