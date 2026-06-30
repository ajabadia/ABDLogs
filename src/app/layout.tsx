/**
 * @purpose Renderiza el layout raíz para la aplicación ABDLogs, incluyendo gestión de ubicación y sesión.
 * @purpose_en Renders the root layout for the ABDLogs application, including locale and session management.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:2,imports:8,sig:4wuisx
 * @lastUpdated 2026-06-30T05:49:32.425Z
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale } from "next-intl/server";
import { getIndustrialSession, configureLogger } from "@ajabadia/satellite-sdk";
import { BrandingStyles } from "@ajabadia/satellite-sdk/styles";
import { SessionProvider } from "@ajabadia/satellite-sdk/client";
import { ThemeProvider } from "@ajabadia/ecosystem-widgets";
import "./globals.css";

configureLogger({
  endpoint: process.env.LOGS_SERVICE_URL || 'http://localhost:5003/api/logs',
  token: process.env.LOGS_SECRET_TOKEN,
  appId: 'ABDLogs',
});

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
  icons: [{ rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' }],
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
        <BrandingStyles />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased navbar-top-layout selection:bg-primary/30`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SessionProvider initialSession={session}>
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
