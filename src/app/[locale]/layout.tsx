/**
 * @purpose Renderiza el layout para la aplicación ABDLogs, incluyendo una navegación lateral, un menú de comandos y notificaciones emergentes.
 * @purpose_en Renders the layout for the ABDLogs application, including a sidebar navigation, command palette, and toaster notifications.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:12,sig:ghum4t
 * @lastUpdated 2026-06-26T10:00:21.650Z
 */

import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import { Suspense } from "react";
import NextTopLoader from "nextjs-toploader";
import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import { SystemSettings } from "@/components/ui/SystemSettings";
import { TenantSelector } from "@/components/ui/TenantSelector";
import { LogsCommandPalette } from "@/components/layout/LogsCommandPalette";
import { EventBusBridge } from "@/components/EventBusBridge";

import { getIndustrialSession } from '@ajabadia/satellite-sdk/auth-middleware';
import { resolveTenantBranding } from "@ajabadia/satellite-sdk";

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const session = await getIndustrialSession();
  const branding = await resolveTenantBranding();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <NextTopLoader
        color="hsl(var(--primary))"
        height={2}
        showSpinner={false}
        zIndex={45}
        speed={200}
      />
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 transition-colors duration-300">
        <SidebarNavigation
          session={session}
          logoUrl={branding?.logoUrl}
          tenantSelectorSlot={session.authenticated ? <TenantSelector sessionUser={session?.user} /> : undefined}
          settingsSlot={<SystemSettings isAuthenticated={session.authenticated} />}
        />
        <LogsCommandPalette />
        <EventBusBridge />

        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
        />
      </div>
    </NextIntlClientProvider>
  );
}
