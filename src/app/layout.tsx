import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale } from "next-intl/server";
import { getIndustrialSession } from "@abd/satellite-sdk";
import { SessionProvider } from "@abd/satellite-sdk/client";
import { ThemeProvider } from "@/components/ThemeProvider";
import { resolveTenantBranding } from "@/lib/tenant-branding";
import { generateTenantCss } from "@abd/styles";
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
  icons: [{ rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' }],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const session = await getIndustrialSession();
  const branding = await resolveTenantBranding();
  const customCss = branding?.theme ? generateTenantCss(branding.theme) : "";

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {customCss && (
          <style id="tenant-branding-gateway" dangerouslySetInnerHTML={{ __html: customCss }} />
        )}
        {branding?.logoUrl && (
          <link rel="icon" href={branding.logoUrl} />
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased navbar-top-layout`} suppressHydrationWarning>
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
