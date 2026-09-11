import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../src/index.css";

export const metadata: Metadata = {
  title: "UXOS - Mobile App Crowd-Testing Platform",
  description: "Get real user feedback, track device compatibility, log detailed bug diagnostics, and release your Android apps with confidence.",
  icons: {
    icon: "/launchops-logo.png",
    shortcut: "/launchops-logo.png",
    apple: "/launchops-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
