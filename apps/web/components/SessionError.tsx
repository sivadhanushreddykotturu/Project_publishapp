import { Logo } from "@/components/marketing/LogoMark";

/** Rendered when server-side session verification fails (bad/missing Clerk keys). */
export function SessionError() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6">
      <Logo />
      <div className="mt-10 max-w-md rounded-[24px] border border-black/5 bg-white p-8 text-center shadow-sm">
        <h1 className="text-[20px] font-semibold text-ink-950">
          Couldn&apos;t verify your session
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-500">
          The server couldn&apos;t reach the auth provider. This is almost
          always a missing or mistyped{" "}
          <code className="rounded bg-paper px-1.5 py-0.5 text-[13px]">
            CLERK_SECRET_KEY
          </code>{" "}
          in the hosting environment. Fix it, redeploy, then refresh.
        </p>
        <a
          href="/sign-in"
          className="mt-6 inline-block rounded-full bg-ink-950 px-6 py-3 text-[14px] font-semibold text-white"
        >
          Back to sign in
        </a>
      </div>
    </main>
  );
}
