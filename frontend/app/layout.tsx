import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../src/index.css";

export const metadata: Metadata = {
  title: "LaunchTest - Mobile App Crowd-Testing Platform",
  description: "Get real user feedback, track device compatibility, log detailed bug diagnostics, and release your Android apps with confidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
