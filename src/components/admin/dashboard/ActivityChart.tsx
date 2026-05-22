'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ActivityChartProps {
  data: {
    date: string;
    total: number;
    errors: number;
  }[];
}

export function ActivityChart({ data }: ActivityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground uppercase tracking-widest text-xs font-bold animate-pulse">
        No hay datos de telemetría disponibles (30 días).
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
        <XAxis 
          dataKey="date" 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={10}
          fontFamily="monospace"
          tickLine={false} 
          axisLine={false}
          tickFormatter={(val) => {
            const date = new Date(val);
            return `${date.getDate()} ${date.toLocaleString('es-ES', { month: 'short' }).toUpperCase()}`;
          }}
          dy={10}
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={10} 
          fontFamily="monospace"
          tickLine={false} 
          axisLine={false} 
          dx={-10}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            borderColor: 'hsl(var(--border))', 
            borderRadius: '0.5rem',
            fontFamily: 'monospace'
          }}
          itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
          labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px' }}
        />
        <Area 
          type="monotone" 
          dataKey="total" 
          stroke="hsl(var(--primary))" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorTotal)" 
          name="Volumen (Global)" 
        />
        <Area 
          type="monotone" 
          dataKey="errors" 
          stroke="hsl(var(--destructive))" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorErrors)" 
          name="Fallos/Riesgo" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
