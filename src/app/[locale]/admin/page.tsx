import { getTranslations } from 'next-intl/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk';
import { LayoutDashboard, ShieldCheck, Activity } from 'lucide-react';
import { DashboardActionCard } from '@/components/admin/dashboard/DashboardActionCard';
import { AdminPageHeader } from '@ajabadia/styles';
import { SystemTelemetryPanel } from '@/components/admin/dashboard/SystemTelemetryPanel';
import { GlobalFooter } from '@ajabadia/ecosystem-widgets';

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
          title={<>{'ABD'} <span className="text-primary">{t('logsTitle')}</span></>}
          description={<>{t('auditDesc')} <span className="text-primary font-bold">{user.tenantId}</span>.</>}
        />

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Controls Column (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Card: Telemetry Dashboard */}
              <DashboardActionCard 
                icon={Activity}
                category="SOC2 COMPLIANCE"
                title="Telemetry Console"
                description="Monitorización visual de volumen operativo, seguridad y actividad SaaS en tiempo real."
                footerLabel={t('prodReady')}
                footerValue={ap('activo') || 'ONLINE'}
                buttonText="Ver Métricas"
                href={`/${locale}/admin/dashboard`}
              />

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

        <GlobalFooter label={t('footer')} opacity={0.8} />

      </div>
    </main>
  );
}
