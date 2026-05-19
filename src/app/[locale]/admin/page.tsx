import { getTranslations } from 'next-intl/server';
import { Separator } from '@/components/ui/separator';
import { ensureIndustrialAccess } from '@/lib/session';
import { LayoutDashboard, ShieldCheck } from 'lucide-react';
import { DashboardActionCard } from '@/components/admin/dashboard/DashboardActionCard';
import { SystemTelemetryPanel } from '@/components/admin/dashboard/SystemTelemetryPanel';

/**
 * 🛰️ Central Admin Logs Portal Page (Federated Server Component)
 * Rediseñado específicamente para la visualización de Auditoría en Cadena de ABDLogs.
 */
export default async function AdminPortalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('admin');
  const ap = await getTranslations('adminPortal');

  // 🛡️ Ecosystem Identity Guard
  const user = await ensureIndustrialAccess('ADMIN');

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
          <div className="flex flex-col gap-2">
            <div className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2 mb-2">
              <LayoutDashboard size={14} className="text-primary animate-pulse" aria-hidden="true" />
              <span className="animate-console-pulse">{t('controlConsole')} • DASHBOARD</span>
            </div>
            
            <h1 className="text-3xl font-black uppercase italic tracking-tight text-foreground leading-none">
              ABD <span className="text-primary">{t('logsTitle')}</span>
            </h1>
            
            <p className="text-sm text-muted-foreground font-sans mt-2 leading-relaxed">
              Consola central de auditoría técnica y operacional del inquilino <span className="text-primary font-bold">{user.tenantId}</span>.
            </p>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Controls Column (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
              
              {/* Card: Chain Auditing Logs */}
              <DashboardActionCard 
                icon={ShieldCheck}
                category={t('certification')}
                title={t('auditTitle')}
                description={t('auditDesc')}
                footerLabel={t('prodReady')}
                footerValue={ap('activo') || 'ONLINE'}
                buttonText={t('auditTitle')}
                href={`/${locale}/admin/audit`}
              />

            </div>
          </div>

          {/* System Telemetry Sidebar (1/3 width) */}
          <SystemTelemetryPanel 
            userId={user.id}
            userRole={user.role}
            locale={locale}
          />

        </div>

        {/* Footer */}
        <footer className="mt-auto pt-12 flex flex-col items-center gap-6 text-muted-foreground/40 font-mono text-[9px] uppercase tracking-[0.3em]" role="contentinfo">
          <Separator className="bg-border" aria-hidden="true" />
          <span>{t('footer')}</span>
        </footer>

      </div>
    </main>
  );
}
