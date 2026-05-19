'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { ShieldCheck, LogIn, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * 🚿 Premium Logout Success Farewell Page
 * Complies with Era 11 Tech-Noir styling guidelines and uncodixfy specifications.
 */
export default function LogoutSuccessPage() {
  const t = useTranslations('logoutSuccess');
  const common = useTranslations('common');
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 🧬 Satisfy React 19 Hydration Immunity
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-muted" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const handleSignIn = () => {
    // Redirecting to the protected /admin path triggers proxy.ts to launch the federated login flow immediately
    router.push('/admin');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground font-sans relative overflow-hidden p-6">
      {/* 🌌 Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
      <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* 🛡️ Content Card */}
      <div className="w-full max-w-[420px] bg-card/40 backdrop-blur-xl border border-border/80 p-8 md:p-10 shadow-2xl relative z-10 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-6 duration-500">
        
        {/* 📟 Pulse Status Indicator */}
        <div className="relative mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 relative z-10">
            <ShieldCheck className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
        </div>

        {/* 🏷️ Badge */}
        <div className="px-3 py-1 bg-secondary border border-border text-[9px] font-black tracking-[0.2em] uppercase text-muted-foreground mb-6">
          {t('shield_badge')}
        </div>

        {/* 🏁 Typography */}
        <h1 className="text-2xl font-black tracking-tighter uppercase mb-3 text-foreground">
          {t('title')}
        </h1>
        
        <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-8 max-w-[320px]">
          {t('subtitle')}
        </p>

        {/* 🔌 Secure Farewell Text */}
        <div className="w-full bg-secondary/20 border border-border/40 p-4 mb-8 text-[10px] font-mono leading-relaxed text-left text-muted-foreground/80 flex items-start gap-3">
          <span className="text-primary font-bold">{`>`}</span>
          <span>{t('message')}</span>
        </div>

        {/* 🚀 Interactive Trigger Button */}
        <button
          aria-label={t('button')}
          onClick={handleSignIn}
          className="w-full h-11 bg-primary hover:bg-primary/95 text-primary-foreground text-[10px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 border-b-2 border-primary-foreground/10 active:border-b-0 active:translate-y-[1px] outline-none"
        >
          <LogIn className="w-4 h-4" />
          {t('button')}
        </button>

        {/* 🏁 Return Link to Public Welcome Page */}
        <button
          aria-label={t('home_button')}
          onClick={() => router.push('/')}
          className="mt-5 text-[9px] font-black text-muted-foreground hover:text-foreground tracking-widest uppercase transition-colors flex items-center gap-1.5 cursor-pointer outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('home_button')}
        </button>
      </div>

      {/* 🏁 Footer Spec */}
      <footer className="absolute bottom-6 opacity-25 text-[8px] font-mono tracking-widest uppercase text-muted-foreground">
        {common('appTitle')} | SEC_REVOKED_LOGOUT_OK
      </footer>
    </div>
  );
}
