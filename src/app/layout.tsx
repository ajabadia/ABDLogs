import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale } from "next-intl/server";
import { generateTenantCss } from "@abd/styles";
import { resolveTenantBranding } from "@/lib/tenant-branding";
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
  title: "ABDQuiz | Industrial Exam Training",
  description: "High-performance platform for exam training and management.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const branding = await resolveTenantBranding();
  const customCss = branding?.theme ? generateTenantCss(branding.theme) : '';

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('theme') || 'dark';
                if (theme === 'system') {
                  var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  document.documentElement.classList.add(isDark ? 'dark' : 'light');
                } else {
                  document.documentElement.classList.add(theme);
                }
              } catch (e) {}
            `,
          }}
        />
        {customCss && (
          <style id="tenant-branding-gateway" dangerouslySetInnerHTML={{ __html: customCss }} />
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
