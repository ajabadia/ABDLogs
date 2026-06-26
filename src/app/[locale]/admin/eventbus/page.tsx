/**
 * @purpose Renderiza el panel administrativo para monitorear eventos del sistema en tiempo real.
 * @purpose_en Renders the admin dashboard for monitoring system events in real-time.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:2,imports:7,sig:3mtopm
 * @lastUpdated 2026-06-26T06:17:37.536Z
 */

import React from 'react';
import { ensureIndustrialAccess } from '@ajabadia/satellite-sdk/auth-middleware';
import { getTranslations } from 'next-intl/server';
import { Activity, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AdminPageHeader } from '@ajabadia/styles';
import { EventBusDashboard } from '@/components/admin/eventbus/EventBusDashboard';

export const revalidate = 0;

export default async function AdminEventBusPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('admin');

  await ensureIndustrialAccess('ADMIN');

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 selection:bg-primary/30">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        <AdminPageHeader
          icon={Activity}
          title="Event Bus"
          description="Monitor de eventos del sistema en tiempo real"
          backButton={
            <Link
              href={`/${locale}/admin`}
              className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
              aria-label="Back to Admin Dashboard"
            >
              <ArrowLeft size={14} />
            </Link>
          }
        />

        <EventBusDashboard />
      </div>
    </main>
  );
}
