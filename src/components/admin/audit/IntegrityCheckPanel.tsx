'use client';

/**
 * @purpose Renderiza un panel para verificar la integridad de una cadena de auditoria utilizando tecnología blockchain.
 * @purpose_en Renders a panel for verifying the integrity of an audit chain using blockchain technology.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:5,sig:1tv2c3e
 * @lastUpdated 2026-06-22T06:31:58.413Z
 */

import { useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { ShieldCheck, ShieldAlert, Loader2, Link2, Search, CheckCircle2 } from 'lucide-react';
import { verifyAuditChainAction } from '@/actions/verifyAuditChain';

interface IntegrityCheckPanelProps {
  tenantId: string;
}

export function IntegrityCheckPanel({ tenantId }: IntegrityCheckPanelProps) {
  const t = useTranslations('admin');
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ isValid: boolean; invalidLogsCount: number; errorDetails: string[] } | null>(null);

  const handleVerify = () => {
    startTransition(async () => {
      const promise = verifyAuditChainAction(tenantId).then(response => {
        if (response.success && response.data) {
          setResult(response.data);
          return response.data;
        }
        throw new Error(response.error || 'Error al verificar la cadena');
      });

      toast.promise(promise, {
        loading: '🔍 Verificando cadena de bloques...',
        success: (data) =>
          data.isValid
            ? '✅ Cadena de bloques válida y sin alteraciones.'
            : `⚠️ Se encontraron ${data.invalidLogsCount} bloques alterados.`,
        error: (err: Error) => err.message || 'Error inesperado al verificar la cadena',
      });
    });
  };

  return (
    <div className="p-5 border border-border bg-card/60 rounded-xl mb-6 shadow-sm overflow-hidden relative">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex gap-4">
          <div className="p-3 bg-primary/10 text-primary border border-primary/20 rounded-lg shrink-0 h-fit">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {t('integrity_title')}
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-lg leading-relaxed">
              Verifica el encadenamiento criptográfico (SHA-256) de los logs de auditoría para garantizar que ninguna entrada ha sido modificada, eliminada o alterada desde su creación. Requisito SOC2.
            </p>
          </div>
        </div>

        <button
          aria-label={t('integrity_execute')}
          onClick={handleVerify}
          disabled={isPending}
          className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(var(--primary),0.2)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('integrity_calculating')}
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              {t('integrity_execute')}
            </>
          )}
        </button>
      </div>

      {result && (
        <div className={`mt-5 p-4 rounded-lg border animate-in fade-in slide-in-from-top-2 ${
          result.isValid 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="flex items-center gap-3">
            {result.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-500" />
            )}
            <div>
              <h4 className={`text-sm font-bold ${result.isValid ? 'text-emerald-500' : 'text-red-500'}`}>
                {result.isValid 
                  ? t('chain_valid') 
                  : t('chain_alert')}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {result.isValid 
                  ? 'Todos los hashes y bloques enlazan correctamente. No se detectaron alteraciones.' 
                  : `Se detectaron discrepancias en ${result.invalidLogsCount} bloques.`}
              </p>
            </div>
          </div>

          {!result.isValid && result.errorDetails && result.errorDetails.length > 0 && (
            <div className="mt-4 pt-4 border-t border-red-500/20 space-y-2">
              <h5 className="text-[11px] font-black uppercase tracking-wider text-red-400">{t('fracture_details')}</h5>
              <ul className="space-y-1.5">
                {result.errorDetails.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs font-mono text-red-400/80 bg-red-950/20 p-2 rounded">
                    <Link2 className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
