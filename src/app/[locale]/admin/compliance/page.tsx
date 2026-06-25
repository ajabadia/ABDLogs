/**
 * @purpose Gestiona la página de cumplimiento administrativo para GDPR y regulaciones, maneja autenticación del usuario, selección de inquilinos y muestra una interfaz de cliente de cumplimiento.
 * @purpose_en Renders the admin compliance page for GDPR and regulation, handling user authentication, tenant selection, and displaying a compliance client interface.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:2,imports:8,sig:1uf1u70
 * @lastUpdated 2026-06-25T10:26:50.877Z
 */

import React from 'react';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import { ComplianceClient } from '@/components/admin/compliance/ComplianceClient';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { AdminPageHeader } from '@ajabadia/styles';

export const revalidate = 0;

interface SearchParams {
  tenantId?: string;
}

export default async function AdminCompliancePage({
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

  // 2. Select target tenant matching request
  const targetTenantId = isSuperAdmin && tenantId ? tenantId : user.tenantId;

  // 3. Connect to Mongoose DB
  await connectDB();

  const tenantConfig = {
    name: targetTenantId === 'SYSTEM' ? 'Sistema Global' : `Organización: ${targetTenantId}`,
    tenantId: targetTenantId,
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Breadcrumbs & Header */}
        <AdminPageHeader
          icon={ShieldAlert}
          breadcrumb={<>{t('controlConsole')} • {tenantConfig.name}</>}
          title="Cumplimiento GDPR & Regulación"
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
          description="Herramientas integradas para la portabilidad regulada de datos y el derecho al olvido sin alterar la integridad de auditoría forense."
        />

        {/* GDPR Compliance UI Client */}
        <div className="pt-2">
          <ComplianceClient tenantId={targetTenantId} />
        </div>

      </div>
    </main>
  );
}
