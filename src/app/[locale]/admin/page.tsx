import { getTranslations } from 'next-intl/server';
import { ensureIndustrialAccess } from '@/lib/session';
import { LayoutDashboard, ShieldCheck } from 'lucide-react';
import { DashboardActionCard } from '@/components/admin/dashboard/DashboardActionCard';
import { AdminPageHeader } from '@abd/styles';
import { SystemTelemetryPanel } from '@/components/admin/dashboard/SystemTelemetryPanel';
import { Footer } from '@abd/styles';

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
        
        {/* Header Navigation */}
        <AdminPageHeader
          icon={LayoutDashboard}
          breadcrumb={<>{t('controlConsole')} • DASHBOARD</>}
          title={<>ABD <span className="text-primary">{t('logsTitle')}</span></>}
          description={<>Consola central de auditoría técnica y operacional del inquilino <span className="text-primary font-bold">{user.tenantId}</span>.</>}
        />

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

        <Footer label={t('footer')} opacity="high" />

      </div>
    </main>
  );
}
