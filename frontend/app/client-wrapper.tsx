"use client";

import { useCallback, useEffect, useState } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import App from "../src/App";
import ClerkAuthScreen from "../src/integration/ClerkAuthScreen";
import AuthConfigurationScreen from "../src/integration/AuthConfigurationScreen";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function ClientWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!clerkPublishableKey) {
    return (
      <App
        getAuthToken={async () => null}
        renderAuthScreen={(props) => (
          <AuthConfigurationScreen isDarkMode={props.isDarkMode} onBackToHome={props.onBackToHome} />
        )}
      />
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <LaunchOpsApp />
    </ClerkProvider>
  );
}

function LaunchOpsApp() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const getAuthToken = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return null;

    // Clerk may report the user as signed in just before the session token is
    // available after a cross-page login redirect. Give session restoration a
    // brief chance to finish instead of incorrectly showing "session expired".
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const token = await getToken({ skipCache: attempt > 0 });
      if (token) return token;
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
    return null;
  }, [getToken, isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <App
      getAuthToken={getAuthToken}
      onSignOut={() => signOut({ redirectUrl: "/" })}
      renderAuthScreen={(props) => <ClerkAuthScreen {...props} />}
    />
  );
}
