/**
 * @purpose Gestiona la página de auditoría administrativa con componentes para gestionar los umbrales de alertas, visualizar la historia de alertas y transmitir actividad auditiva en vivo.
 * @purpose_en Renders the administrative audit page with components for managing alert thresholds, viewing alert history, and streaming live audit activity.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:2,imports:11,sig:boy7a8
 * @lastUpdated 2026-06-25T10:26:37.927Z
 */

import React from 'react';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { AuditHistoryPanel } from '@/components/admin/audit/AuditHistoryPanel';
import { IntegrityCheckPanel } from '@/components/admin/audit/IntegrityCheckPanel';
import { AlertThresholdManager } from '@/components/admin/audit/AlertThresholdManager';
import { AlertHistoryPanel } from '@/components/admin/audit/AlertHistoryPanel';
import { ShieldCheck, Activity, ArrowLeft, AlertTriangle, History } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import { AdminPageHeader } from '@ajabadia/styles';

export const revalidate = 0; // Evitar el cacheado estático de la página administrativa

interface SearchParams {
  tenantId?: string;
}

export default async function AdminAuditPage({
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

  // 2. Aislamiento Estricto SaaS: Solo SuperAdmin puede auditar otros tenants vía URL
  const targetTenantId = isSuperAdmin && tenantId ? tenantId : user.tenantId;

  // Conectar a la base de datos principal
  await connectDB();

  // 3. Recuperar la configuración del tenant auditado actual (fallback para microservicio desacoplado)
  const tenantConfig = {
    name: targetTenantId === 'SYSTEM' ? 'Sistema Global' : `Organización: ${targetTenantId}`,
    tenantId: targetTenantId,
  };

  // El selector unificado global en el layout ya se encarga del cambio de contexto.

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Encabezado Principal */}
        <AdminPageHeader
          icon={ShieldCheck}
          breadcrumb={<>{t('controlConsole')} • {tenantConfig.name}</>}
          title={t('auditTitle')}
          backButton={
              <Link 
                href={`/${locale}/admin`}
                className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
                aria-label="Back to Admin Dashboard"
                title="Back to Dashboard"
              >
                <ArrowLeft size={14} aria-hidden="true" />
              </Link>
          }
          description={t('auditDesc')}
        />

        {/* Panel de Análisis de Integridad */}
        <IntegrityCheckPanel key={targetTenantId} tenantId={targetTenantId} />

        {/* 🔴 Alert Configuration and History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AlertThresholdManager tenantId={targetTenantId} />
          <AlertHistoryPanel tenantId={targetTenantId} />
        </div>

        {/* 📊 Hot Log Streaming — Historial de Auditoría en Vivo */}
        <div className="flex flex-col gap-6 pt-2">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <span className="p-1 rounded-md bg-primary/10 text-primary">
                <Activity className="w-4.5 h-4.5" />
              </span>
              {t('auditActivityHistory')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t('auditActivityDesc')}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
            <AuditHistoryPanel key={targetTenantId} tenantId={targetTenantId} />
          </div>
        </div>

      </div>
    </main>
  );
}
