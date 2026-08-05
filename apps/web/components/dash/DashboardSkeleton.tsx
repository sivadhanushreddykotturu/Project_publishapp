/** Instant feedback while a dashboard segment's server components fetch. */
export function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen animate-pulse bg-paper">
      {/* sidebar stub — desktop */}
      <div className="fixed inset-y-0 left-0 hidden w-[260px] border-r border-black/5 bg-white md:block">
        <div className="px-6 py-6">
          <div className="h-8 w-32 rounded-xl bg-black/8" />
        </div>
        <div className="space-y-2 px-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 rounded-xl bg-black/5" />
          ))}
        </div>
      </div>

      <div className="flex min-h-screen flex-1 flex-col md:pl-[260px]">
        {/* topbar stub */}
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 md:px-8">
          <div className="h-7 w-36 rounded-lg bg-black/8" />
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-black/6" />
            <div className="size-10 rounded-full bg-black/6" />
          </div>
        </div>
        {/* mobile nav stub */}
        <div className="flex gap-2 px-4 pb-3 pt-3 md:hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-20 shrink-0 rounded-full bg-black/6" />
          ))}
        </div>

        {/* content skeleton */}
        <div className="flex-1 space-y-5 px-5 py-8 md:px-8">
          <div className="mx-auto max-w-6xl space-y-5">
            <div className="h-36 rounded-[24px] bg-black/5" />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="h-28 rounded-[20px] bg-black/5" />
              <div className="h-28 rounded-[20px] bg-black/5" />
              <div className="h-28 rounded-[20px] bg-black/5" />
            </div>
            <div className="h-24 rounded-[20px] bg-black/5" />
            <div className="h-24 rounded-[20px] bg-black/5" />
            <div className="h-24 rounded-[20px] bg-black/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
