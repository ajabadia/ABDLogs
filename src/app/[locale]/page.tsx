import { getTranslations } from 'next-intl/server';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Cpu, Sliders, Database, ShieldCheck, Palette, Layers } from 'lucide-react';
import Link from 'next/link';

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
        <header className="flex flex-col gap-6 items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 border border-border text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono rounded">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {h('status')}
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-foreground italic uppercase antialiased">
            ABD <span className="text-primary">{h('tenants')}</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-[650px] font-light leading-relaxed">
            {h('tagline')}
          </p>
        </header>

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
          
          {/* Feature 1: Execution Engine */}
          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Palette className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'Marca Blanca en Caliente' : 'Hot White-Labeling'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Generación dinámica de variables HSL y YIQ Contrast en el servidor de Next.js, logrando inyección directa instantánea.'
                : 'Dynamic generation of HSL and YIQ Contrast custom tokens rendered during server-side SSR loops to secure zero visual flicker.'}
            </p>
          </div>

          {/* Feature 2: Scoring Systems */}
          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'Jerarquías de Espacio' : 'Space Hierarchies'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Aislamiento lógico perimetral a nivel de repositorio y materialized paths recursivos para aulas y organizaciones.'
                : 'Logic boundaries and role isolation calculated inside data repositories with recursive materialized subdivisions.'}
            </p>
          </div>

          {/* Feature 3: Security & Deduplication */}
          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {locale === 'es' ? 'Seguridad Criptográfica' : 'Cryptographic Security'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {locale === 'es'
                ? 'Cifrado simétrico AES-256-CBC nativo de credenciales, tokens y configuraciones de cobro persistidos en base de datos.'
                : 'Symmetric AES-256-CBC envelope encryption protecting customer configuration and sensitive billing fields in the database.'}
            </p>
          </div>

        </div>

        {/* Telemetry Footer */}
        <footer className="flex flex-col items-center gap-6 text-muted-foreground/50 font-mono text-[9px] uppercase tracking-[0.3em] pt-8" role="contentinfo">
          <Separator className="w-24 bg-border" aria-hidden="true" />
          <div className="flex gap-12">
            <span>Control Plane: {h('version')}</span>
            <span>Estilo: {h('style')}</span>
          </div>
        </footer>

      </div>
    </main>
  );
}
