import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import { SystemSettings } from "@/components/ui/SystemSettings";
import { TenantSelector } from "@/components/ui/TenantSelector";
import { LogsCommandPalette } from "@/components/layout/LogsCommandPalette";
import { Search } from "lucide-react";
import { getIndustrialSession } from "@/lib/session";
import { resolveTenantBranding } from "@/lib/tenant-branding";

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
      <SidebarNavigation session={session} logoUrl={branding?.logoUrl} />
      <LogsCommandPalette />
      
      {/* ⚙️ Floating System Settings Trigger & Search (Top-Right) */}
      <div className="fixed top-6 right-6 z-40 flex items-center gap-2">
        <TenantSelector sessionUser={session?.user} />
        <button
          id="command-palette-trigger"
          aria-label="Buscar comandos (Ctrl+K)"
          className="p-2.5 rounded-none border border-border bg-background/80 backdrop-blur-md hover:bg-muted text-foreground transition-all active:scale-90 cursor-pointer shadow-lg flex items-center justify-center gap-2"
        >
          <Search size={18} className="text-foreground shrink-0" />
          <span className="hidden md:inline-flex items-center text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 font-sans">
            {locale === "es" ? "BUSCADOR" : "SEARCH"}
          </span>
          <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono rounded bg-white/10 text-white/50 border border-white/5 uppercase">
            Ctrl+K
          </kbd>
        </button>
        <SystemSettings isAuthenticated={session.authenticated} />
      </div>

      {children}
      <Toaster 
        position="top-right" 
        richColors 
        closeButton 
      />
    </NextIntlClientProvider>
  );
}
