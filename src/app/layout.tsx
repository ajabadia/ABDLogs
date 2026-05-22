import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale } from "next-intl/server";
import { BrandingStyles, getIndustrialSession } from "@abd/satellite-sdk";
import { SessionProvider } from "@abd/satellite-sdk/client";
import { ThemeScript } from "@abd/styles";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ABDLogs | Governance & Telemetry",
  description: "High-performance platform for log governance and telemetry monitoring.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const session = await getIndustrialSession();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ThemeScript />
        {/* Centralized dynamic branding styles injection (Zero FOUC) */}
        <BrandingStyles />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <SessionProvider initialSession={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
