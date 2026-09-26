"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { SignInButton, SignOutButton, SignUpButton, UserButton, useAuth, useUser } from "@clerk/nextjs";
import { CheckCircle2, Loader2, LogOut, UserPlus } from "lucide-react";
import {
  getCurrentLaunchOpsUser,
  syncLaunchOpsUser,
  updateCurrentLaunchOpsUser,
  updateMyClientProfile,
  updateMyTesterProfile,
  type BackendClient,
  type BackendTesterProfile,
  type LaunchOpsUser,
} from "../lib/launchops-api";

type ClerkAuthScreenProps = {
  isDarkMode: boolean;
  initialRole?: "tester" | "client";
  onLoginSuccess: (name: string, role: "tester" | "client" | "admin") => void;
  onBackToHome: () => void;
};

type SyncState = "idle" | "syncing" | "synced" | "error";
type RegistrationDetails = {
  phone: string;
  companyName: string;
  contactName: string;
  billingAddress: string;
  gstin: string;
  country: string;
  specialty: string;
  experienceLevel: "beginner" | "intermediate" | "expert";
  deviceModel: string;
  androidVersion: string;
  upiVpa: string;
};
const intendedRoleKey = "launchops_intended_role";

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export default function ClerkAuthScreen({ isDarkMode, initialRole = "tester", onLoginSuccess, onBackToHome }: ClerkAuthScreenProps) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { isLoaded: isUserLoaded, user } = useUser();
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [syncError, setSyncError] = useState<string>("");
  const [launchOpsUser, setLaunchOpsUser] = useState<LaunchOpsUser | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [details, setDetails] = useState<RegistrationDetails>({
    phone: "", companyName: "", contactName: "", billingAddress: "", gstin: "",
    country: "India", specialty: "", experienceLevel: "beginner", deviceModel: "", androidVersion: "", upiVpa: "",
  });
  const [syncAttempt, setSyncAttempt] = useState(0);
  const [selectedRole, setSelectedRole] = useState<"tester" | "client">(() => {
    if (typeof window === "undefined") return initialRole;
    const storedRole = sessionStorage.getItem(intendedRoleKey);
    return storedRole === "client" || storedRole === "tester" ? storedRole : initialRole;
  });
  const syncStartedRef = useRef(false);
  const getTokenRef = useRef(getToken);
  const onLoginSuccessRef = useRef(onLoginSuccess);
  const userId = user?.id;
  const email = user?.primaryEmailAddress?.emailAddress;
  const displayName = user?.fullName || user?.username || (email ? email.split("@")[0] : "");

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  useEffect(() => {
    onLoginSuccessRef.current = onLoginSuccess;
  }, [onLoginSuccess]);

  useEffect(() => {
    if (!isLoaded || !isUserLoaded) return;

    if (!isSignedIn) {
      syncStartedRef.current = false;
      setLaunchOpsUser(null);
      setSyncState("idle");
      setSyncError("");
      return;
    }

    if (!userId || syncStartedRef.current) return;

    let cancelled = false;
    syncStartedRef.current = true;

    async function syncUser() {
      setSyncState("syncing");
      setSyncError("");

      try {
        const token = await withTimeout(
          getTokenRef.current(),
          10000,
          "Getting your Clerk session took too long. Please try again."
        );
        if (!token) throw new Error("Missing Clerk session token");
        if (!email) throw new Error("Your Clerk account needs a primary email address");

        const name = displayName || email.split("@")[0];
        const intendedRole = sessionStorage.getItem(intendedRoleKey);
        const signupMetadataRole = user?.unsafeMetadata?.launchOpsRole ?? user?.unsafeMetadata?.role;
        const savedMetadataRole = user?.publicMetadata?.launchOpsRole ?? user?.publicMetadata?.role;
        const requestedRole = intendedRole === "client" || intendedRole === "tester"
          ? intendedRole
          : signupMetadataRole === "client" || signupMetadataRole === "tester"
            ? signupMetadataRole
            : savedMetadataRole === "client" || savedMetadataRole === "tester"
              ? savedMetadataRole
              : selectedRole;
        const response = await syncLaunchOpsUser({ role: requestedRole, name, email }, token);
        if (cancelled) return;

        setLaunchOpsUser(response.data);
        setSyncState("synced");
        sessionStorage.removeItem(intendedRoleKey);
        if (response.data.role === "admin") {
          onLoginSuccessRef.current(response.data.name, response.data.role);
          return;
        }
        const current = await getCurrentLaunchOpsUser(token);
        if (cancelled) return;
        const profile = current.data.profile as BackendClient | BackendTesterProfile | null;
        const clientProfile = response.data.role === "client" ? profile as BackendClient | null : null;
        const testerProfile = response.data.role === "tester" ? profile as BackendTesterProfile | null : null;
        const hasRequiredDetails = response.data.role === "client"
          ? Boolean(response.data.phone?.trim() && clientProfile?.companyName?.trim() && clientProfile?.contactName?.trim())
          : Boolean(response.data.phone?.trim() && testerProfile?.country?.trim() && testerProfile?.specialty?.trim() && testerProfile?.devices?.length && testerProfile?.upi?.vpa?.trim());
        const isComplete = Boolean(response.data.profileCompletedAt && hasRequiredDetails);
        if (isComplete) {
          onLoginSuccessRef.current(response.data.name, response.data.role);
          return;
        }
        setDetails((value) => ({
          ...value,
          phone: response.data.phone ?? "",
          companyName: clientProfile?.companyName ?? "",
          contactName: clientProfile?.contactName ?? response.data.name,
          billingAddress: clientProfile?.billingInfo?.billingAddress ?? "",
          gstin: clientProfile?.billingInfo?.gstin ?? "",
          country: testerProfile?.country ?? "India",
          specialty: testerProfile?.specialty ?? "",
          experienceLevel: testerProfile?.experienceLevel ?? "beginner",
          deviceModel: testerProfile?.devices?.[0]?.model ?? "",
          androidVersion: testerProfile?.devices?.[0]?.androidVersion ?? "",
          upiVpa: testerProfile?.upi?.vpa ?? "",
        }));
        setNeedsProfile(true);
      } catch (error) {
        if (cancelled) return;
        syncStartedRef.current = false;
        setSyncState("error");
        setSyncError(error instanceof Error ? error.message : "Could not sync your account");
      }
    }

    void syncUser();

    return () => {
      cancelled = true;
      syncStartedRef.current = false;
    };
  }, [displayName, email, isLoaded, isSignedIn, isUserLoaded, selectedRole, syncAttempt, userId]);

  const completeRegistration = async (event: FormEvent) => {
    event.preventDefault();
    if (!launchOpsUser || launchOpsUser.role === "admin") return;
    setProfileSaving(true);
    setProfileError("");
    try {
      const token = await getTokenRef.current();
      if (!token) throw new Error("Missing Clerk session token");
      await updateCurrentLaunchOpsUser({ name: launchOpsUser.role === "client" ? details.contactName.trim() : launchOpsUser.name, phone: details.phone.trim(), profileCompleted: true }, token);
      if (launchOpsUser.role === "client") {
        await updateMyClientProfile({
          companyName: details.companyName.trim(),
          contactName: details.contactName.trim(),
          billingInfo: {
            billingAddress: details.billingAddress.trim() || undefined,
            gstin: details.gstin.trim() || undefined,
          },
        }, token);
      } else {
        const fingerprintKey = "launchops_device_fingerprint";
        let fingerprint = localStorage.getItem(fingerprintKey);
        if (!fingerprint) {
          fingerprint = crypto.randomUUID();
          localStorage.setItem(fingerprintKey, fingerprint);
        }
        await updateMyTesterProfile({
          devices: [{ model: details.deviceModel.trim(), androidVersion: details.androidVersion.trim(), fingerprint }],
          experienceLevel: details.experienceLevel,
          country: details.country.trim(),
          specialty: details.specialty.trim(),
          upi: { vpa: details.upiVpa.trim() },
        }, token);
      }
      setNeedsProfile(false);
      onLoginSuccessRef.current(
        launchOpsUser.role === "client" ? details.contactName.trim() : launchOpsUser.name,
        launchOpsUser.role,
      );
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Could not save registration details");
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div
      className={`min-h-[calc(100vh-80px)] mt-20 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative ${
        isDarkMode ? "bg-[#050505]" : "bg-slate-50"
      }`}
    >
      <div
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 blur-[120px] rounded-full pointer-events-none ${
          isDarkMode ? "bg-indigo-500/10" : "bg-indigo-100/50"
        }`}
      />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/launchops-logo.png" alt="UXOS Logo" className="w-12 h-12 object-contain" />
          </div>
          <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-950"}`}>
            UXOS Account
          </h2>
          <p className={`mt-2 text-sm font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Sign in to your client or tester workspace.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div
          className={`border rounded-3xl p-8 md:p-10 shadow-2xl transition-all duration-300 ${
            isDarkMode
              ? "bg-[#0C0C0F]/90 border-white/5 shadow-indigo-500/5"
              : "bg-white border-slate-100 shadow-slate-200/50"
          }`}
        >
          {!isLoaded && (
            <div className={`flex items-center justify-center gap-3 text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading
            </div>
          )}

          {isLoaded && !isSignedIn && (
            <div className="space-y-4">
              <div className={`grid grid-cols-2 gap-1 rounded-xl p-1 ${isDarkMode ? "bg-white/5" : "bg-slate-100"}`}>
                {(["client", "tester"] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role);
                      sessionStorage.setItem(intendedRoleKey, role);
                    }}
                    className={`rounded-lg px-3 py-2 text-xs font-extrabold uppercase transition ${
                      selectedRole === role
                        ? "bg-indigo-600 text-white shadow-sm"
                        : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <SignInButton mode="redirect" forceRedirectUrl={`/auth/${selectedRole}`}>
                <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition hover:shadow-lg hover:shadow-indigo-500/20 cursor-pointer border-0">
                  Sign In
                </button>
              </SignInButton>

              <SignUpButton
                mode="redirect"
                forceRedirectUrl={`/auth/${selectedRole}`}
              >
                <button
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition border cursor-pointer ${
                    isDarkMode
                      ? "bg-transparent border-white/10 hover:border-white/20 text-white hover:bg-white/[0.02]"
                      : "bg-white border-slate-200 hover:border-slate-350 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Create {selectedRole === "client" ? "Client" : "Tester"} Account
                </button>
              </SignUpButton>
            </div>
          )}

          {isLoaded && isSignedIn && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <UserButton />
                <div>
                  <p className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {user?.fullName || user?.primaryEmailAddress?.emailAddress || "Signed in"}
                  </p>
                  <p className={`text-xs font-semibold ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                    {syncState === "syncing" && "Syncing"}
                    {syncState === "synced" && "Synced"}
                    {syncState === "error" && "Sync failed"}
                    {syncState === "idle" && "Ready"}
                  </p>
                </div>
              </div>

              {needsProfile && launchOpsUser && launchOpsUser.role !== "admin" && (
                <form onSubmit={completeRegistration} className="space-y-3">
                  <div>
                    <h3 className={`text-base font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>Complete your {launchOpsUser.role} profile</h3>
                    <p className="mt-1 text-xs text-slate-500">These details are required before you can continue.</p>
                  </div>
                  {launchOpsUser.role === "client" ? (
                    <>
                      <input required value={details.companyName} onChange={(event) => setDetails((value) => ({ ...value, companyName: event.target.value }))} placeholder="Company name" className={`w-full rounded-xl border px-3 py-2.5 text-sm ${isDarkMode ? "border-white/10 bg-white/5 text-white" : "border-slate-200"}`} />
                      <input required value={details.contactName} onChange={(event) => setDetails((value) => ({ ...value, contactName: event.target.value }))} placeholder="Contact person" className={`w-full rounded-xl border px-3 py-2.5 text-sm ${isDarkMode ? "border-white/10 bg-white/5 text-white" : "border-slate-200"}`} />
                      <input value={details.billingAddress} onChange={(event) => setDetails((value) => ({ ...value, billingAddress: event.target.value }))} placeholder="Billing address (optional)" className={`w-full rounded-xl border px-3 py-2.5 text-sm ${isDarkMode ? "border-white/10 bg-white/5 text-white" : "border-slate-200"}`} />
                      <input value={details.gstin} onChange={(event) => setDetails((value) => ({ ...value, gstin: event.target.value }))} placeholder="GSTIN (optional)" className={`w-full rounded-xl border px-3 py-2.5 text-sm ${isDarkMode ? "border-white/10 bg-white/5 text-white" : "border-slate-200"}`} />
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <input required value={details.country} onChange={(event) => setDetails((value) => ({ ...value, country: event.target.value }))} placeholder="Country" className={`rounded-xl border px-3 py-2.5 text-sm ${isDarkMode ? "border-white/10 bg-white/5 text-white" : "border-slate-200"}`} />
                        <select required value={details.experienceLevel} onChange={(event) => setDetails((value) => ({ ...value, experienceLevel: event.target.value as RegistrationDetails["experienceLevel"] }))} className={`rounded-xl border px-3 py-2.5 text-sm ${isDarkMode ? "border-white/10 bg-[#121218] text-white" : "border-slate-200 bg-white"}`}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="expert">Expert</option></select>
                      </div>
                      <select required value={details.specialty} onChange={(event) => setDetails((value) => ({ ...value, specialty: event.target.value }))} className={`w-full rounded-xl border px-3 py-2.5 text-sm ${isDarkMode ? "border-white/10 bg-[#121218] text-white" : "border-slate-200 bg-white"}`}><option value="">Select testing specialty</option><option value="Android Testing">Android Testing</option><option value="UX Testing">UX Testing</option><option value="Functional Testing">Functional Testing</option><option value="Performance Testing">Performance Testing</option><option value="Security Testing">Security Testing</option></select>
                      <div className="grid grid-cols-2 gap-3">
                        <input required value={details.deviceModel} onChange={(event) => setDetails((value) => ({ ...value, deviceModel: event.target.value }))} placeholder="Device model" className={`rounded-xl border px-3 py-2.5 text-sm ${isDarkMode ? "border-white/10 bg-white/5 text-white" : "border-slate-200"}`} />
                        <input required value={details.androidVersion} onChange={(event) => setDetails((value) => ({ ...value, androidVersion: event.target.value }))} placeholder="Android version" className={`rounded-xl border px-3 py-2.5 text-sm ${isDarkMode ? "border-white/10 bg-white/5 text-white" : "border-slate-200"}`} />
                      </div>
                      <input required pattern=".+@.+" value={details.upiVpa} onChange={(event) => setDetails((value) => ({ ...value, upiVpa: event.target.value }))} placeholder="UPI ID (example@bank)" className={`w-full rounded-xl border px-3 py-2.5 text-sm ${isDarkMode ? "border-white/10 bg-white/5 text-white" : "border-slate-200"}`} />
                    </>
                  )}
                  <input required value={details.phone} onChange={(event) => setDetails((value) => ({ ...value, phone: event.target.value }))} placeholder="Phone number" className={`w-full rounded-xl border px-3 py-2.5 text-sm ${isDarkMode ? "border-white/10 bg-white/5 text-white" : "border-slate-200"}`} />
                  {profileError && <p className="text-xs font-semibold text-red-500">{profileError}</p>}
                  <button disabled={profileSaving} className="w-full rounded-xl border-0 bg-indigo-600 py-3 text-sm font-bold text-white disabled:opacity-50">{profileSaving ? "Saving details..." : "Complete Registration"}</button>
                </form>
              )}

              {!needsProfile && syncState === "syncing" && (
                <div className={`flex items-center gap-2 text-sm font-bold ${isDarkMode ? "text-indigo-300" : "text-indigo-700"}`}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting to UXOS
                </div>
              )}

              {!needsProfile && syncState === "synced" && (
                <div className={`flex items-center gap-2 text-sm font-bold ${isDarkMode ? "text-emerald-300" : "text-emerald-700"}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  {launchOpsUser?.name || "Account"} is ready
                </div>
              )}

              {!needsProfile && syncState === "error" && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-red-500">{syncError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      syncStartedRef.current = false;
                      setSyncState("idle");
                      setSyncAttempt((attempt) => attempt + 1);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-4 rounded-xl font-semibold transition cursor-pointer border-0"
                  >
                    Try Again
                  </button>
                </div>
              )}

              <SignOutButton>
                <button
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 transition border cursor-pointer ${
                    isDarkMode
                      ? "bg-transparent border-white/10 hover:border-white/20 text-white hover:bg-white/[0.02]"
                      : "bg-white border-slate-200 hover:border-slate-350 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </SignOutButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
