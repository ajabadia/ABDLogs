'use client';

/**
 * @purpose Renderiza un panel de control que muestra datos de telemetry para una aplicación, incluyendo gráficas de actividad y distribución de aplicaciones.
 * @purpose_en Renders a dashboard displaying telemetry data for an application, including activity charts and app distribution charts.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:7,sig:1ree079
 * @lastUpdated 2026-06-30T13:01:41.490Z
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ActivityChart } from './ActivityChart';
import { AppDistributionChart } from './AppDistributionChart';
import { StorageProviderBadge } from './storage-provider-badge';
import { Activity, ShieldAlert, BarChart3, Loader2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

interface TelemetryData { date: string; appId: string; action: string; count: number; }

export function TelemetryDashboard({ tenantId }: { tenantId: string }) {
  const t = useTranslations('admin');
  const [data, setData] = useState<TelemetryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function fetchTelemetry() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/telemetry?tenantId=${tenantId}&days=${days}`);
        if (!res.ok) throw new Error('Failed to fetch telemetry');
        setData(await res.json());
      } catch (err) { console.error(err); toast.error('Error sincronizando telemetría visual.'); }
      finally { setLoading(false); }
    }
    fetchTelemetry();
  }, [tenantId, days]);

  if (loading && data.length === 0) {
    return <div className="h-[500px] border border-border bg-card/30 rounded-xl flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin opacity-50" /></div>;
  }

  const aggregatedByDate = data.reduce((acc, curr) => {
    if (!acc[curr.date]) acc[curr.date] = { date: curr.date, total: 0, errors: 0 };
    acc[curr.date].total += curr.count;
    if (curr.action.includes('FAIL') || curr.action.includes('ERROR') || curr.action.includes('DENIED')) acc[curr.date].errors += curr.count;
    return acc;
  }, {} as Record<string, { date: string; total: number; errors: number }>);

  const chartData = Object.values(aggregatedByDate).sort((a, b) => a.date.localeCompare(b.date));
  const appDistribution = data.reduce((acc, curr) => {
    if (!acc[curr.appId]) acc[curr.appId] = { name: curr.appId, value: 0 };
    acc[curr.appId].value += curr.count;
    return acc;
  }, {} as Record<string, { name: string; value: number }>);
  const barChartData = Object.values(appDistribution).sort((a, b) => b.value - a.value);

  const totalEvents = data.reduce((a, b) => a + b.count, 0);
  const totalErrors = chartData.reduce((a, b) => a + b.errors, 0);
  const activeApps = new Set(data.map(d => d.appId)).size;

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between border border-border p-2 rounded-xl bg-card shadow-sm">
        <div className="flex items-center gap-2 text-[11px] font-black text-muted-foreground uppercase px-2 tracking-widest"><CalendarDays className="w-4 h-4 text-primary" />{t('telemetry_window')}</div>
        <div className="flex items-center gap-1">
          {[7, 15, 30, 90].map((d) => (
            <button key={d} aria-label={`${d}D`} onClick={() => setDays(d)} disabled={loading}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${days === d ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-secondary text-muted-foreground'} ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>{d}D</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 border border-border bg-card hover:bg-secondary/10 transition-colors rounded-xl flex items-center gap-5">
          <div className="p-3 bg-primary/10 rounded-lg"><Activity className="text-primary w-6 h-6" /></div>
          <div><p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">{t('telemetry_volume', { days })}</p><p className="text-3xl font-black font-mono">{totalEvents.toLocaleString()}</p></div>
        </div>
        <div className="p-6 border border-border bg-card hover:bg-secondary/10 transition-colors rounded-xl flex items-center gap-5">
          <div className="p-3 bg-emerald-500/10 rounded-lg"><BarChart3 className="text-emerald-500 w-6 h-6" /></div>
          <div><p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">{t('telemetry_active_satellites')}</p><p className="text-3xl font-black font-mono">{activeApps}</p></div>
        </div>
        <div className="p-6 border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors rounded-xl flex items-center gap-5">
          <div className="p-3 bg-destructive/20 rounded-lg"><ShieldAlert className="text-destructive w-6 h-6" /></div>
          <div><p className="text-[10px] text-destructive uppercase tracking-widest font-bold mb-1">{t('telemetry_risks', { days })}</p><p className="text-3xl font-black font-mono text-destructive">{totalErrors.toLocaleString()}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-2">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{t('telemetry_flow')}</h3>
          <div className="p-6 border border-border bg-card rounded-xl h-[350px] relative">
            {loading && <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}
            <ActivityChart data={chartData} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{t('telemetry_distribution')}</h3>
          <div className="p-6 border border-border bg-card rounded-xl h-[350px] relative">
            {loading && <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}
            <AppDistributionChart data={barChartData} />
          </div>
        </div>
      </div>

      <div className="w-full max-w-xs">
        <StorageProviderBadge />
      </div>
    </div>
  );
}
