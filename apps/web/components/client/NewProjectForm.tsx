/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Upload,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { api, ApiClientError } from "@/lib/api";
import { formatINR } from "@/lib/format";

type WizardStep = "service" | "package" | "details" | "payment_success";

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

interface RazorpayInstance {
  open: () => void;
}

type RazorpayConstructor = new (options: {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  theme?: { color?: string };
}) => RazorpayInstance;

export function NewProjectForm() {
  const router = useRouter();
  const { getToken } = useAuth();

  // Wizard state
  const [step, setStep] = useState<WizardStep>("service");

  // Step 1: Service selection (Playstore is active; iOS and UX are disabled/admin-contact)
  const [selectedService] = useState<"playstore">("playstore");

  // Step 2: Package & Testers count
  const [testerCount, setTesterCount] = useState<number>(14);
  const packageKey = "closed_testing_standard";

  // Step 3: App Details & Links
  const [appName, setAppName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [appIcon, setAppIcon] = useState<string>("");
  const [webOptInUrl, setWebOptInUrl] = useState("");
  const [playStoreUrl, setPlayStoreUrl] = useState("");
  const [description, setDescription] = useState("");

  // Payment & Redirect state
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  // Auto-generate package name slug if empty
  useEffect(() => {
    if (appName && !packageName) {
      const slug = appName.toLowerCase().replace(/[^a-z0-9]/g, "");
      setPackageName(`com.${slug || "app"}.testing`);
    }
  }, [appName, packageName]);

  // Handle countdown timer for Step 4
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "payment_success" && createdProjectId && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (step === "payment_success" && createdProjectId && countdown === 0) {
      router.push(`/client/projects/${createdProjectId}`);
    }
    return () => clearTimeout(timer);
  }, [step, countdown, createdProjectId, router]);

  // Pricing math: ₹2,999 base (14 testers) + ₹100 per additional tester
  const basePrice = 2999_00;
  const extraTesters = Math.max(0, testerCount - 14);
  const extraPrice = extraTesters * 100_00;
  const subtotalPaise = basePrice + extraPrice;
  const gstPaise = Math.round(subtotalPaise * 0.18);
  const totalPaise = subtotalPaise + gstPaise;

  // File upload for app profile photo / icon
  function handleIconFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAppIcon(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // App icon fallback letter
  const fallbackLetter = (appName.trim()[0] || "A").toUpperCase();

  // Create project & initiate Razorpay payment
  async function handleCheckout() {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const token = await getToken();

      // 1. Create project & invoice
      const { project, invoice } = await api<{
        project: { _id: string };
        invoice: { _id: string; totalPaise: number };
      }>("/projects", {
        token,
        method: "POST",
        body: {
          packageKey,
          projectType: "play_store_internal",
          testerCount,
          appDetails: {
            appName,
            packageName: packageName.trim(),
            iconUrl: appIcon || undefined,
            webOptInUrl: webOptInUrl.trim() || undefined,
            playStoreUrl: playStoreUrl.trim() || undefined,
            description: description.trim() || undefined,
          },
        },
      });

      setCreatedProjectId(project._id);

      // 2. Fetch Razorpay Order
      const rzpOrder = await api<{
        orderId: string;
        amountPaise: number;
        currency: string;
        keyId: string;
        isTestMode: boolean;
      }>(`/invoices/${invoice._id}/create-razorpay-order`, {
        token,
        method: "POST",
      });

      // 3. Launch Razorpay or auto-verify test payment
      const triggerVerification = async (paymentId: string) => {
        await api(`/invoices/${invoice._id}/verify-razorpay-payment`, {
          token,
          method: "POST",
          body: { razorpay_payment_id: paymentId },
        });
        setBusy(false);
        setStep("payment_success");
        setCountdown(5);
      };

      const win = window as typeof window & { Razorpay?: RazorpayConstructor };
      if (typeof window !== "undefined" && !win.Razorpay && !rzpOrder.isTestMode) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      if (win.Razorpay && !rzpOrder.isTestMode) {
        const rzp = new win.Razorpay({
          key: rzpOrder.keyId,
          amount: rzpOrder.amountPaise,
          currency: rzpOrder.currency,
          name: "PublishApp",
          description: `Play Store Closed Testing - ${appName}`,
          order_id: rzpOrder.orderId,
          handler: async (response: RazorpaySuccessResponse) => {
            await triggerVerification(response.razorpay_payment_id);
          },
          theme: { color: "#4F46E5" },
        });
        rzp.open();
        setBusy(false);
      } else {
        // Test / Sandbox mode fallback (instant confirmation)
        await triggerVerification(`pay_test_${Date.now()}`);
      }
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Could not complete project creation",
      );
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* ================= STEP 1: SERVICE SELECTION ================= */}
      {step === "service" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div>
            <h2 className="text-[32px] font-bold tracking-tight text-ink-950">
              What do you need help with?
            </h2>
            <p className="mt-2 text-[15px] text-ink-500">
              Select your release track to get compliant real testers.
            </p>
          </div>

          <div className="space-y-4">
            {/* Playstore Closed Testing (Active) */}
            <div className="relative rounded-[24px] border-2 border-ink-950 bg-white p-6 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-[20px] font-bold text-ink-950">
                      Playstore Closed Testing
                    </h3>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                      Active
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] text-ink-500">
                    14-day testing cycle · 14+ verified real Android testers
                  </p>
                </div>
                <div className="grid size-7 place-items-center rounded-full bg-ink-950 text-white">
                  <Check className="size-4" strokeWidth={3} />
                </div>
              </div>
            </div>

            {/* IOS App Publishing & Testing (Contact Admin) */}
            <div className="relative rounded-[24px] border border-black/10 bg-slate-50/70 p-6 opacity-75 cursor-not-allowed">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-[19px] font-bold text-slate-700">
                      iOS App Publishing & Testing
                    </h3>
                    <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                      <Lock className="size-3" /> Contact Admin
                    </span>
                  </div>
                  <p className="mt-1 text-[13.5px] text-slate-500">
                    Direct admin consultation for App Store & TestFlight tracks.
                  </p>
                </div>
              </div>
            </div>

            {/* User Experience Testing (Contact Admin) */}
            <div className="relative rounded-[24px] border border-black/10 bg-slate-50/70 p-6 opacity-75 cursor-not-allowed">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-[19px] font-bold text-slate-700">
                      User Experience (UX) Testing
                    </h3>
                    <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                      <Lock className="size-3" /> Contact Admin
                    </span>
                  </div>
                  <p className="mt-1 text-[13.5px] text-slate-500">
                    Direct admin coordination for specialized UX feedback studies.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setStep("package")}
              className="flex items-center gap-2 rounded-full bg-ink-950 px-8 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-black hover:scale-[1.02]"
            >
              Next <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: PACKAGE & PRICING ================= */}
      {step === "package" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div>
            <h2 className="text-[32px] font-bold tracking-tight text-ink-950">
              Play Store Closed Testing Package
            </h2>
            <p className="mt-2 text-[15px] text-ink-500">
              Billed one time per app. Guaranteed 14-day continuous testing by real Android users.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="relative overflow-hidden rounded-[28px] border-2 border-ink-950 bg-white p-8 shadow-xl">
            <div className="absolute right-6 top-6">
              <span className="rounded-full bg-amber-100 px-3.5 py-1 text-[12px] font-semibold text-amber-900">
                14 Days Testing
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-[22px] font-bold text-ink-950">
                Standard Closed Testing Track
              </h3>
              <p className="text-[14px] text-ink-500">
                Min 14 testers required by Google Play Console policy
              </p>
            </div>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-[44px] font-extrabold tracking-tight text-ink-950">
                {formatINR(subtotalPaise)}
              </span>
              <span className="text-[20px] font-medium text-ink-400 line-through">
                ₹3,499/-
              </span>
            </div>
            <p className="text-[12.5px] text-ink-400">One-time payment (+18% GST)</p>

            <div className="mt-8 border-t border-black/10 pt-6">
              <label className="block">
                <div className="flex items-center justify-between">
                  <span className="text-[14.5px] font-semibold text-ink-900">
                    Number of Real Testers
                  </span>
                  <span className="text-[12.5px] font-medium text-emerald-600">
                    Min 14 required by Google
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setTesterCount((prev) => Math.max(14, prev - 1))}
                    disabled={testerCount <= 14}
                    className="grid size-10 place-items-center rounded-xl border border-black/15 bg-zinc-50 text-[18px] font-bold text-ink-900 disabled:opacity-40 hover:bg-zinc-100 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-[22px] font-bold text-ink-950 w-12 text-center">
                    {testerCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTesterCount((prev) => prev + 1)}
                    className="grid size-10 place-items-center rounded-xl border border-black/15 bg-zinc-50 text-[18px] font-bold text-ink-900 hover:bg-zinc-100 transition-colors"
                  >
                    +
                  </button>
                  <span className="text-[13px] text-ink-600">
                    {testerCount > 14
                      ? `(+₹${(extraTesters * 100).toLocaleString()} for ${extraTesters} extra testers @ ₹100/tester)`
                      : "Standard 14 testers bundle (₹2,999)"}
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep("service")}
              className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-[14.5px] font-medium text-ink-700 hover:bg-zinc-50"
            >
              <ArrowLeft className="size-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => setStep("details")}
              className="flex items-center gap-2 rounded-full bg-ink-950 px-8 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-black hover:scale-[1.02]"
            >
              Continue to App Details <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: APP DETAILS & 2 LINKS ================= */}
      {step === "details" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div>
            <h2 className="text-[32px] font-bold tracking-tight text-ink-950">
              App Details & Testing Links
            </h2>
            <p className="mt-2 text-[15px] text-ink-500">
              Provide your app profile and the two Google Play testing URLs.
            </p>
          </div>

          <div className="rounded-[28px] border border-black/10 bg-white p-7 shadow-sm space-y-6">
            {/* App Icon Upload with First Letter Fallback */}
            <div>
              <span className="mb-2 block text-[14px] font-semibold text-ink-900">
                App Profile Photo / Icon
              </span>
              <div className="flex items-center gap-5">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-[22px] border-2 border-dashed border-black/15 bg-zinc-50 shadow-inner flex items-center justify-center">
                  {appIcon ? (
                    <img
                      src={appIcon}
                      alt="App Icon"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-[32px] font-extrabold shadow-sm">
                      {fallbackLetter}
                    </div>
                  )}
                </div>
                <div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/10 bg-zinc-50 px-4 py-2 text-[13.5px] font-medium text-ink-800 hover:bg-zinc-100">
                    <Upload className="size-4" /> Upload icon
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIconFile}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-1 text-[12px] text-ink-400">
                    If no image is uploaded, defaults to first letter of app name.
                  </p>
                </div>
              </div>
            </div>

            {/* App Name */}
            <div>
              <label className="block">
                <span className="mb-1.5 block text-[13.5px] font-medium text-ink-900">
                  App Name <span className="text-orange-500">*</span>
                </span>
                <input
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g. Blinkit"
                  className={inputCls}
                />
              </label>
            </div>

            {/* Package Name */}
            <div>
              <label className="block">
                <span className="mb-1.5 block text-[13.5px] font-medium text-ink-900">
                  Package Name
                </span>
                <input
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="e.g. com.blinkit.app"
                  className={inputCls}
                />
              </label>
            </div>

            {/* LINK 1: Web Opt-In Link */}
            <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4">
              <label className="block">
                <span className="flex items-center gap-2 text-[14px] font-semibold text-amber-950">
                  1. Google Play Web Opt-In Link (Where testers opt in){" "}
                  <span className="text-orange-500">*</span>
                </span>
                <span className="mt-1 block text-[12.5px] text-amber-800">
                  The link from Google Play Console where testers accept your testing invite:
                  <code className="ml-1 bg-amber-100/90 px-1.5 py-0.5 rounded text-[11.5px] font-mono">
                    https://play.google.com/apps/testing/...
                  </code>
                </span>
                <input
                  required
                  value={webOptInUrl}
                  onChange={(e) => setWebOptInUrl(e.target.value)}
                  placeholder="https://play.google.com/apps/testing/com.your.app"
                  type="url"
                  className={`mt-2 ${inputCls}`}
                />
              </label>
            </div>

            {/* LINK 2: Play Store App Download Link */}
            <div className="rounded-2xl bg-sky-50/70 border border-sky-200/80 p-4">
              <label className="block">
                <span className="flex items-center gap-2 text-[14px] font-semibold text-sky-950">
                  2. Google Play Store Download Link{" "}
                  <span className="text-orange-500">*</span>
                </span>
                <span className="mt-1 block text-[12.5px] text-sky-800">
                  Direct Google Play Store link where testers download your app:
                  <code className="ml-1 bg-sky-100/90 px-1.5 py-0.5 rounded text-[11.5px] font-mono">
                    https://play.google.com/store/apps/details?id=...
                  </code>
                </span>
                <input
                  required
                  value={playStoreUrl}
                  onChange={(e) => setPlayStoreUrl(e.target.value)}
                  placeholder="https://play.google.com/store/apps/details?id=com.your.app"
                  type="url"
                  className={`mt-2 ${inputCls}`}
                />
              </label>
            </div>

            {/* Description */}
            <div>
              <label className="block">
                <span className="mb-1.5 block text-[13.5px] font-medium text-ink-900">
                  Special Testing Instructions (Optional)
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Any particular features, demo credentials, or testing instructions for users..."
                  className={`${inputCls} resize-none`}
                />
              </label>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-orange-500/10 px-4 py-3 text-[14px] text-orange-600">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep("package")}
              className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-[14.5px] font-medium text-ink-700 hover:bg-zinc-50"
            >
              <ArrowLeft className="size-4" /> Back
            </button>
            <button
              type="button"
              disabled={busy || !appName || !webOptInUrl || !playStoreUrl}
              onClick={handleCheckout}
              className="flex items-center gap-2 rounded-full bg-[#4F46E5] px-9 py-4 text-[15.5px] font-semibold text-white transition-all hover:bg-[#4338CA] hover:scale-[1.02] disabled:opacity-40 shadow-sm"
            >
              {busy ? "Processing Payment…" : `Pay ${formatINR(totalPaise)} with Razorpay`}
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: PAYMENT SUCCESS & REDIRECT ================= */}
      {step === "payment_success" && (
        <div className="rounded-[32px] border border-black/10 bg-white p-10 text-center shadow-xl animate-in zoom-in-95 duration-300">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-100 text-emerald-600 mb-6">
            <CheckCircle2 className="size-12" />
          </div>

          <h2 className="text-[30px] font-extrabold tracking-tight text-ink-950">
            Payment Completed!
          </h2>
          <p className="mt-2 text-[16px] text-ink-600 max-w-md mx-auto">
            Your Play Store testing project is registered and sent to the admin team for review and publishing to testers.
          </p>

          <div className="mt-8 rounded-2xl bg-zinc-50 p-6 border border-black/5 max-w-md mx-auto">
            <p className="text-[14.5px] font-medium text-ink-700">
              Redirecting to your project in{" "}
              <span className="font-bold text-ink-950 text-[20px] mx-1">
                {countdown}
              </span>{" "}
              seconds...
            </p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full bg-[#4F46E5] transition-all duration-1000 ease-linear"
                style={{ width: `${((5 - countdown) / 5) * 100}%` }}
              />
            </div>
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={() => router.push(`/client/projects/${createdProjectId}`)}
              className="inline-flex items-center gap-2 rounded-full bg-ink-950 px-8 py-3.5 text-[15px] font-semibold text-white hover:bg-black transition-all"
            >
              Go to Project Now <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-ink-400 focus:border-[#4F46E5]";
