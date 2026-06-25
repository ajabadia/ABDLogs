/**
 * @purpose Rendes la página de dashboard administrativo con datos de telemetry y garantiza el acceso industrial.
 * @purpose_en Renders the admin dashboard page with telemetry data and ensures industrial access.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:2,imports:7,sig:195jriw
 * @lastUpdated 2026-06-22T06:30:34.363Z
 */

import React from 'react';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { Activity, ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { AdminPageHeader } from '@ajabadia/styles';
import { TelemetryDashboard } from '@/components/admin/dashboard/TelemetryDashboard';

export const revalidate = 0; 

interface SearchParams {
  tenantId?: string;
}

export default async function AdminDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  const { tenantId } = await searchParams;
  const t = await getTranslations('admin');
  
  // 1. Garantizar acceso seguro y ROL mínimo de administrador
  const user = await ensureIndustrialAccess('ADMIN');
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  // 2. Aislamiento Estricto SaaS
  const targetTenantId = isSuperAdmin && tenantId ? tenantId : user.tenantId;
  const tenantName = targetTenantId === 'SYSTEM' ? 'Sistema Global' : `Organización: ${targetTenantId}`;

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Encabezado Principal */}
        <AdminPageHeader
          icon={Activity}
          breadcrumb={<>{t('controlConsole')} • {tenantName}</>}
          title="Telemetry Console"
          backButton={
              <Link 
                href={`/${locale}/admin`}
                className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
                aria-label="Back to Admin"
                title="Back to Admin"
              >
                <ArrowLeft size={14} aria-hidden="true" />
              </Link>
          }
          description="Visualización analítica SOC2 en tiempo real. Actividad de seguridad, rendimiento y accesos del ecosistema."
        />

        {/* 📊 Visual Dashboard */}
        <div className="flex flex-col gap-6 pt-2">
          <TelemetryDashboard tenantId={targetTenantId} />
        </div>

      </div>
    </main>
  );
}
