import { getTranslations } from 'next-intl/server';
import { ArrowRight, Cpu, Sliders, Database, ShieldCheck } from 'lucide-react';
import { HeroHeader } from '@abd/styles';
import Link from 'next/link';
import { Footer } from '@abd/styles';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('common');
  const h = await getTranslations('home');
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-background text-foreground selection:bg-primary/30 overflow-hidden" role="main">
      {/* Tactical grid background layer */}
      <div className="absolute inset-0 bg-industrial-grid mask-industrial-fade pointer-events-none opacity-50" aria-hidden="true" />

      <div className="z-10 w-full max-w-5xl flex flex-col gap-16 animate-in fade-in duration-500">
        
        {/* Core Brand Header */}
        <HeroHeader
          statusText={h('status')}
          title={
            <>{'ABD'} <span className="text-primary">{h('tenants')}</span></>
          }
          description={h('tagline')}
        />

        {/* Central Tactical Action Area (CTA) */}
        <div className="flex flex-col items-center justify-center gap-4">
          <Link
            href={`/${locale}/admin`}
            className="inline-flex items-center justify-center px-10 py-5 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest hover:bg-primary/80 transition-all duration-300 font-black cursor-pointer shadow-lg active:scale-95 border border-primary/30 rounded-lg"
          >
            {h('accessControlPlane')}
            <ArrowRight className="w-4 h-4 ml-3 animate-pulse" />
          </Link>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
            {locale === 'es' 
              ? 'Inicie sesión con sus credenciales federadas de ABDAuth' 
              : 'Sign in utilizing your federated credentials from ABDAuth'}
          </span>
        </div>

        {/* Tactical Key Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="region" aria-label="System Capabilities">
          
          {/* Feature 1: Log Ingestion API */}
          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'API de Ingesta' : 'Ingestion API'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Ingesta ultrarrápida y no bloqueante mediante REST API con validación de seguridad por Bearer tokens inter-servicio.'
                : 'High-performance, non-blocking ingestion via REST API secured with inter-service Bearer tokens.'}
            </p>
          </div>

          {/* Feature 2: Centralized Audit Trail */}
          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'Trazabilidad Central' : 'Centralized Audit Trail'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Consulta e inspección unificada de logs de actividad técnica y operacional del ecosistema ABD en tiempo real.'
                : 'Unified real-time query and inspection of technical and operational activity logs across the ABD ecosystem.'}
            </p>
          </div>

          {/* Feature 3: Dynamic App Filtering */}
          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'Filtro Dinámico' : 'Dynamic App Filtering'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Filtrado interactivo por aplicación de origen (Auth, Quiz, Gobernanza) y organización con agregación automática.'
                : 'Interactive filtering by source application (Auth, Quiz, Governance) and organization with automatic aggregation.'}
            </p>
          </div>

        </div>

        <Footer 
          separatorWidth="short"
          telemetryItems={[
            { label: locale === 'es' ? 'Microservicio' : 'Microservice', value: h('version') },
            { label: locale === 'es' ? 'Estilo' : 'Style', value: h('style') }
          ]}
        />

      </div>
    </main>
  );
}
