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
  const { getToken, signOut } = useAuth();
  const getAuthToken = useCallback(() => getToken(), [getToken]);

  return (
    <App
      getAuthToken={getAuthToken}
      onSignOut={() => signOut({ redirectUrl: "/" })}
      renderAuthScreen={(props) => <ClerkAuthScreen {...props} />}
    />
  );
}
