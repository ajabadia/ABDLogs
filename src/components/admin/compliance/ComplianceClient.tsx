'use client';

/**
 * @purpose Renderiza una interfaz de gestión de cumplimiento para exportar datos y anonimizar información de usuario.
 * @purpose_en Renders a compliance management interface for exporting data and anonymizing user information.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:18tw4s0
 * @lastUpdated 2026-06-22T06:32:06.503Z
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Database, Shield, Lock, Download, Trash2, ShieldAlert, Loader2 } from 'lucide-react';

interface ComplianceClientProps {
  tenantId: string;
}

export function ComplianceClient({ tenantId }: ComplianceClientProps) {
  const t = useTranslations('admin');

  // State for Data Portability (Export)
  const [exportPassword, setExportPassword] = useState('');
  const [exporting, setExporting] = useState(false);

  // State for Right to be Forgotten (Forget)
  const [forgetUser, setForgetUser] = useState('');
  const [forgetIp, setForgetIp] = useState('');
  const [forgetting, setForgetting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await fetch('/api/admin/compliance/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: exportPassword,
          tenantId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate export file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdpr_export_${tenantId}_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(
        exportPassword.trim()
          ? '🔑 Exportación cifrada generada y descargada con éxito.'
          : '📄 Exportación generada y descargada con éxito.'
      );
      setExportPassword('');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Error al exportar los datos');
    } finally {
      setExporting(false);
    }
  };

  const handleForget = async () => {
    if (!forgetUser.trim() && !forgetIp.trim()) {
      toast.error('Especifica un identificador de usuario, email o IP.');
      return;
    }

    const confirmAction = confirm(
      '¿Estás seguro de que deseas anonimizar todas las referencias a este operador/IP? Esta acción es irreversible.'
    );
    if (!confirmAction) return;

    try {
      setForgetting(true);
      const response = await fetch('/api/admin/compliance/forget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUser: forgetUser,
          targetIp: forgetIp,
          tenantId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el derecho al olvido');
      }

      toast.success(
        `🧹 Se han anonimizado con éxito ${data.affectedCount} registros de logs.`
      );
      setForgetUser('');
      setForgetIp('');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Error al procesar la anonimización');
    } finally {
      setForgetting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Card 1: Data Portability (Export) */}
      <div className="p-6 border border-border bg-card/60 rounded-xl shadow-sm relative flex flex-col justify-between">
        <div className="flex gap-4">
          <div className="p-3 bg-primary/10 text-primary border border-primary/20 rounded-lg shrink-0 h-fit">
            <Database className="w-6 h-6" />
          </div>
          <div className="w-full">
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              Portabilidad de Datos (GDPR Art. 20)
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Exporta un volcado completo de la base de datos de telemetría, logs de auditoría forense, configuraciones y alertas correspondientes al tenant activo en formato ZIP.
            </p>

            <div className="mt-5 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Contraseña de Cifrado (Opcional)
                </label>
                <input
                  type="password"
                  placeholder="Introduce una clave para cifrar el archivo JSON"
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  className="w-full bg-background border border-border focus:border-primary/50 text-foreground px-3 py-2 text-xs rounded outline-none transition-all"
                />
                <span className="text-[9px] text-muted-foreground leading-normal">
                  Si se especifica, los datos internos se cifrarán utilizando el estándar industrial AES-256-CBC y se incluirán instrucciones de descifrado en el README.txt.
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          aria-label="Descargar backup GDPR en formato ZIP"
          onClick={handleExport}
          disabled={exporting}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(var(--primary),0.2)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generando Paquete...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Descargar Backup (.ZIP)
            </>
          )}
        </button>
      </div>

      {/* Card 2: Right to be Forgotten (Forget) */}
      <div className="p-6 border border-red-500/30 bg-red-950/5 rounded-xl shadow-sm relative flex flex-col justify-between">
        <div className="flex gap-4">
          <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg shrink-0 h-fit">
            <Shield className="w-6 h-6" />
          </div>
          <div className="w-full">
            <h3 className="text-sm font-black uppercase tracking-wider text-red-500">
              Derecho al Olvido (GDPR Art. 17)
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Anonimiza de forma selectiva y permanente el identificador, correo o dirección IP del operador en la base de datos de logs.
            </p>

            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mt-4 flex gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-[10px] text-red-400 leading-relaxed font-bold">
                ¡ATENCIÓN! La anonimización sobrescribe permanentemente el correo, ID de usuario e IP con la etiqueta [GDPR_ERASED]. La cadena de bloques criptográfica mantiene su integridad pero los datos personales quedarán inaccesibles de forma irreversible.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  ID de Usuario o Email del Operador
                </label>
                <input
                  type="text"
                  placeholder="Ej: user-123 o admin@empresa.com"
                  value={forgetUser}
                  onChange={(e) => setForgetUser(e.target.value)}
                  className="w-full bg-background border border-border focus:border-red-500/50 text-foreground px-3 py-2 text-xs rounded outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Dirección IP (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 192.168.1.45"
                  value={forgetIp}
                  onChange={(e) => setForgetIp(e.target.value)}
                  className="w-full bg-background border border-border focus:border-red-500/50 text-foreground px-3 py-2 text-xs rounded outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          aria-label="Ejecutar anonimización GDPR del operador"
          onClick={handleForget}
          disabled={forgetting}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-red-600 text-white hover:bg-red-500 transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {forgetting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Procesando Limpieza...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Ejecutar Anonimización
            </>
          )}
        </button>
      </div>
    </div>
  );
}
