/**
 * @purpose Renderiza la página de aterrizaje para la aplicación ABDLogs, incluyendo un encabezado heroico, botón de inicio de sesión y sección de capacidades del sistema.
 * @purpose_en Renders the landing page for the ABDLogs application, including a hero header, login button, and system capabilities section.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:6,sig:ywc3gc
 * @lastUpdated 2026-06-30T11:18:20.128Z
 */

import { getTranslations } from 'next-intl/server';
import { ArrowRight, Cpu, Sliders, Database, ShieldCheck } from 'lucide-react';
import { HeroHeader, LandingPageLayout, SubtleLoginButton } from '@ajabadia/styles';
import { GlobalFooter } from '@ajabadia/ecosystem-widgets';
import { getIndustrialSession } from '@ajabadia/satellite-sdk/auth-middleware';
import { redirect } from 'next/navigation';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getIndustrialSession();

  if (session.authenticated && session.user) {
    redirect(`/${locale}/admin`);
  }

  const t = await getTranslations('common');
  const h = await getTranslations('home');

  return (
    <LandingPageLayout>
      <HeroHeader
        statusText={h('status')}
        title={
          <>{'ABD'} <span className="text-primary">{'Logs'}</span></>
        }
        description={h('tagline')}
      />

      <main className="flex flex-col gap-16">
        <SubtleLoginButton
          href={`/${locale}/admin`}
          label={h('accessControlPlane')}
          hint={locale === 'es'
            ? 'Inicie sesión con sus credenciales federadas de ABDAuth'
            : 'Sign in utilizing your federated credentials from ABDAuth'}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="region" aria-label="System Capabilities">
          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'API de Ingesta' : 'Ingestion API'}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Ingesta ultrarrápida y no bloqueante mediante REST API con validación de seguridad por Bearer tokens inter-servicio.'
                : 'High-performance, non-blocking ingestion via REST API secured with inter-service Bearer tokens.'}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'Trazabilidad Central' : 'Centralized Audit Trail'}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Consulta e inspección unificada de logs de actividad técnica y operacional del ecosistema ABD en tiempo real.'
                : 'Unified real-time query and inspection of technical and operational activity logs across the ABD ecosystem.'}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'Filtro Dinámico' : 'Dynamic App Filtering'}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Filtrado interactivo por aplicación de origen (Auth, Quiz, Gobernanza) y organización con agregación automática.'
                : 'Interactive filtering by source application (Auth, Quiz, Governance) and organization with automatic aggregation.'}
            </p>
          </div>

        </div>
      </main>

      <GlobalFooter
        separatorWidth="short"
        telemetryItems={[
          { label: locale === 'es' ? 'Microservicio' : 'Microservice', value: h('version') },
          { label: locale === 'es' ? 'Estilo' : 'Style', value: h('style') }
        ]}
      />
    </LandingPageLayout>
  );
}
