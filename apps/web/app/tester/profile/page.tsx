import { serverApi } from "@/lib/server-api";
import { ProfileForm, type TesterProfileData } from "@/components/tester/ProfileForm";

export const dynamic = "force-dynamic";

export default async function TesterProfilePage() {
  let tester: TesterProfileData | null = null;
  try {
    const data = await serverApi<{ tester: TesterProfileData }>("/testers/me");
    tester = data.tester;
  } catch {
    tester = null;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-[24px] font-semibold tracking-tight text-ink-950">
        Tester profile
      </h2>
      <p className="mt-2 text-[14.5px] text-ink-500">
        Your device and UPI details power fraud checks and payouts. One UPI
        handle per account.
      </p>
      <div className="mt-8">
        <ProfileForm initial={tester} />
      </div>
    </div>
  );
}
