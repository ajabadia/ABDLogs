/**
 * @purpose Gestiona el panel de amenazas para un usuario administrativo, manejando control de acceso, resolución de inquilinos y carga inicial de datos anormales.
 * @purpose_en Renders the Threats Dashboard for an admin user, handling access control, tenant resolution, and initial anomaly data loading.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:2,imports:9,sig:plgox5
 * @lastUpdated 2026-06-26T10:00:17.298Z
 */

import React from 'react';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import { ThreatsDashboard } from '@/components/admin/threats/ThreatsDashboard';
import { AnomalyEngine } from '@/services/tenant/anomaly-engine';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { AdminPageHeader } from '@ajabadia/styles';

export const revalidate = 0;

interface SearchParams {
  tenantId?: string;
}

export default async function AdminThreatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  const { tenantId } = await searchParams;
  const t = await getTranslations('admin');

  // 1. Enforce admin privileges
  const user = await ensureIndustrialAccess('ADMIN');
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  // 2. Resolve target tenant
  const targetTenantId = isSuperAdmin && tenantId ? tenantId : (user.tenantId ?? 'SYSTEM');

  // 3. Connect and pre-load open anomalies (SSR)
  await connectDB();
  const initialAnomalies = await AnomalyEngine.getAnomalies(targetTenantId, 'OPEN', 50);

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">

        <AdminPageHeader
          icon={ShieldAlert}
          breadcrumb={<>{t('controlConsole')} • {targetTenantId}</>}
          title="Detección Predictiva de Amenazas"
          backButton={
            <Link
              href={`/${locale}/admin`}
              className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
              aria-label="Volver al panel de administración"
              title="Volver al Dashboard"
            >
              <ArrowLeft size={14} aria-hidden="true" />
            </Link>
          }
          description="Motor heurístico estadístico de detección de anomalías operativas: fuerza bruta, borrado masivo, accesos fuera de horario e IPs desconocidas. Informe ejecutivo SOC2 integrado."
        />

        <div className="pt-2">
          <ThreatsDashboard
            initialAnomalies={initialAnomalies}
            tenantId={targetTenantId}
          />
        </div>

      </div>
    </main>
  );
}
