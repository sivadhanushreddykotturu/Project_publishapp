import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DefineUX — Real testers for Google Play closed testing",
  description:
    "DefineUX runs your Google Play closed test or iOS TestFlight beta: 14+ real testers on real devices, daily engagement, structured bug reports, and a completion report ready for Play Console and App Store Connect.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
