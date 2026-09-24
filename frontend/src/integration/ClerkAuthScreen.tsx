"use client";

import { useEffect, useRef, useState } from "react";
import { SignInButton, SignOutButton, SignUpButton, UserButton, useAuth, useUser } from "@clerk/nextjs";
import { CheckCircle2, Loader2, LogOut, UserPlus } from "lucide-react";
import { syncLaunchOpsUser, type LaunchOpsUser } from "../lib/launchops-api";

type ClerkAuthScreenProps = {
  isDarkMode: boolean;
  initialRole?: "tester" | "client";
  onLoginSuccess: (name: string, role: "tester" | "client" | "admin") => void;
  onBackToHome: () => void;
};

type SyncState = "idle" | "syncing" | "synced" | "error";
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
        onLoginSuccessRef.current(response.data.name, response.data.role);
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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 mb-4 transform rotate-12">
            <span className="font-extrabold italic text-lg">LT</span>
          </div>
          <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-slate-950"}`}>
            LaunchTest Account
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

              {syncState === "syncing" && (
                <div className={`flex items-center gap-2 text-sm font-bold ${isDarkMode ? "text-indigo-300" : "text-indigo-700"}`}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting to UXOS
                </div>
              )}

              {syncState === "synced" && (
                <div className={`flex items-center gap-2 text-sm font-bold ${isDarkMode ? "text-emerald-300" : "text-emerald-700"}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  {launchOpsUser?.name || "Account"} is ready
                </div>
              )}

              {syncState === "error" && (
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
