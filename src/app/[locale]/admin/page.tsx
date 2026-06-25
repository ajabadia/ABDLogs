/**
 * @purpose Renderiza la página de administración central con registros, incluyendo una consola de dashboard, un encabezado de navegación y un panel de telemetry del sistema.
 * @purpose_en Renders the central admin logs portal page with a dashboard, navigation header, and system telemetry panel.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:8,sig:l2flat
 * @lastUpdated 2026-06-23T23:06:09.265Z
 */

import { getTranslations } from 'next-intl/server';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { LayoutDashboard, ShieldCheck, Activity, ArrowLeft, ShieldAlert, BrainCircuit } from 'lucide-react';
import { DashboardActionCard } from '@/components/admin/dashboard/DashboardActionCard';
import { AdminPageHeader } from '@ajabadia/styles';
import { SystemTelemetryPanel } from '@/components/admin/dashboard/SystemTelemetryPanel';
import { GlobalFooter } from '@ajabadia/ecosystem-widgets';
import Link from 'next/link';

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
        
        {/* Back to home */}
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {locale === 'es' ? 'Volver a Inicio' : 'Back to Home'}
        </Link>

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

              {/* Card: GDPR Compliance */}
              <DashboardActionCard 
                icon={ShieldAlert}
                category="REGULATORIO GDPR"
                title="Cumplimiento GDPR"
                description="Portabilidad de datos (ZIP cifrado) y Derecho al Olvido mediante anonimización de logs."
                footerLabel={t('prodReady')}
                footerValue={ap('activo') || 'ONLINE'}
                buttonText="Ver Panel"
                href={`/${locale}/admin/compliance`}
              />

              {/* Card: Threat Detection */}
              <DashboardActionCard
                icon={BrainCircuit}
                category="SOC2 · HEURÍSTICA IA"
                title="Detección de Amenazas"
                description="Motor predictivo de anomalías: fuerza bruta, borrados masivos, accesos nocturnos e IPs desconocidas."
                footerLabel={t('prodReady')}
                footerValue={ap('activo') || 'ONLINE'}
                buttonText="Ver Amenazas"
                href={`/${locale}/admin/threats`}
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
