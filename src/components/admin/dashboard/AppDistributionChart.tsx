'use client';

/**
 * @purpose Renderiza un gráfico de barras vertical para mostrar la distribución de aplicaciones.
 * @purpose_en Renders a vertical bar chart to display the distribution of applications.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:eha38v
 * @lastUpdated 2026-06-22T06:32:16.035Z
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslations } from 'next-intl';

interface AppDistributionChartProps {
  data: {
    name: string;
    value: number;
  }[];
}

export function AppDistributionChart({ data }: AppDistributionChartProps) {
  const t = useTranslations('admin');
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground uppercase tracking-widest text-xs font-bold animate-pulse">
        {t('tenant_selector_empty')}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} opacity={0.3} />
        <XAxis 
          type="number"
          stroke="hsl(var(--muted-foreground))" 
          fontSize={10}
          fontFamily="monospace"
          tickLine={false} 
          axisLine={false}
        />
        <YAxis 
          dataKey="name" 
          type="category"
          stroke="hsl(var(--foreground))" 
          fontSize={10} 
          fontFamily="monospace"
          tickLine={false} 
          axisLine={false} 
          width={90}
          tickFormatter={(val) => val.toUpperCase()}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            borderColor: 'hsl(var(--border))', 
            borderRadius: '0.5rem',
            fontFamily: 'monospace'
          }}
          itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
          labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px', textTransform: 'uppercase' }}
          cursor={{ fill: 'hsl(var(--secondary))', opacity: 0.2 }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.5)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
