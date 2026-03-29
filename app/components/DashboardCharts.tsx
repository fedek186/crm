"use client";

/*
Este archivo contiene los componentes de gráficos para el Dashboard principal, utilizando Recharts.
Al ser un componente de cliente que incluye bibliotecas pesadas de gráficos, debe ser importado dinámicamente.

Elementos externos:
- Recharts (AreaChart, BarChart, LineChart, etc.): provee los componentes base para los gráficos.

Funciones exportadas:
- DashboardCharts: Renderiza los tres gráficos principales descritos en los requerimientos (Adquisición, Rendimiento Diario y Engagement).
*/

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
} from "recharts";

type MetricRecord = {
  id: number;
  date: Date;
  total_users: number | null;
  new_users: number | null;
  active_users_7d: number | null;
  total_transactions: number | null;
  new_transactions: number | null;
  avg_transactions_per_user: number | null;
  avg_transactions_per_active_user: number | null;
};

interface DashboardChartsProps {
  data: MetricRecord[];
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
  // Format dates for charts
  const chartData = data.map((d) => ({
    ...d,
    formattedDate: new Date(d.date).toLocaleDateString("es-AR", { month: "short", day: "numeric", timeZone: 'UTC' }),
    // Ensure missing data falls back to 0 for charts
    total_users: d.total_users || 0,
    new_users: d.new_users || 0,
    active_users_7d: d.active_users_7d || 0,
    new_transactions: d.new_transactions || 0,
    avg_transactions_per_user: Math.round((d.avg_transactions_per_user || 0) * 100) / 100, // round to 2 decimals
    avg_transactions_per_active_user: Math.round((d.avg_transactions_per_active_user || 0) * 100) / 100, 
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-lux-surface/90 backdrop-blur-md border border-lux-hover/60 p-4 flex flex-col gap-3 rounded-xl shadow-2xl text-sm z-50 min-w-[160px]">
          <p className="text-white font-semibold opacity-90 mb-1 border-b border-lux-hover/50 pb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: entry.color, color: entry.color }}></span>
                <span className="text-lux-sec font-medium">{entry.name}</span>
              </div>
              <span className="text-white font-bold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Gráfico 1: Evolución de Usuarios */}
      <div className="bg-lux-surface rounded-xl shadow-2xl border border-lux-hover/40 p-6 md:p-8">
        <h3 className="text-lg md:text-xl font-bold mb-6 tracking-tight text-white drop-shadow-sm flex items-center">
          <span className="w-2 h-6 bg-lux-gold rounded-full mr-3"></span>
          Evolución y Adquisición de Usuarios
        </h3>
        <div className="h-[300px] md:h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#ffffff08" vertical={false} />
              <XAxis dataKey="formattedDate" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickMargin={14} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickMargin={14} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff10', strokeWidth: 2 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} />
              <Area
                type="monotone"
                dataKey="total_users"
                name="Usuarios Totales"
                stroke="#818cf8"
                fillOpacity={1}
                fill="url(#colorTotal)"
                strokeWidth={3}
                activeDot={{ r: 7, strokeWidth: 0, fill: "#6366f1" }}
              />
              <Area
                type="monotone"
                dataKey="active_users_7d"
                name="Usuarios Activos (7d)"
                stroke="#fbbf24"
                fillOpacity={1}
                fill="url(#colorActive)"
                strokeWidth={3}
                activeDot={{ r: 7, strokeWidth: 0, fill: "#f59e0b" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico 2: Rendimiento Diario */}
        <div className="bg-lux-surface rounded-xl shadow-2xl border border-lux-hover/40 p-6 md:p-8">
          <h3 className="text-lg md:text-xl font-bold mb-6 tracking-tight text-white drop-shadow-sm flex items-center">
             <span className="w-2 h-6 bg-slate-500 rounded-full mr-3"></span>
             Nuevos Registros vs Transacciones
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="formattedDate" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickMargin={14} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickMargin={14} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} />
                <Bar dataKey="new_users" name="Nuevos Usuarios" fill="#818cf8" radius={[6, 6, 0, 0]} maxBarSize={30} />
                <Bar dataKey="new_transactions" name="Nuevas Trans." fill="#fbbf24" radius={[6, 6, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 3: Engagement */}
        <div className="bg-lux-surface rounded-xl shadow-2xl border border-lux-hover/40 p-6 md:p-8">
          <h3 className="text-lg md:text-xl font-bold mb-6 tracking-tight text-white drop-shadow-sm flex items-center">
             <span className="w-2 h-6 bg-[#14b8a6] rounded-full mr-3"></span>
             Evolución del Engagement
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="formattedDate" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickMargin={14} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickMargin={14} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff10', strokeWidth: 2, strokeDasharray: '4 4' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} />
                <Line
                  type="monotone"
                  dataKey="avg_transactions_per_active_user"
                  name="Tx / Usuario Activo"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                  activeDot={{ r: 7, strokeWidth: 0, fill: "#059669" }}
                />
                <Line
                  type="monotone"
                  dataKey="avg_transactions_per_user"
                  name="Tx / Usuario (Global)"
                  stroke="#64748b"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#64748b", strokeWidth: 0 }}
                  activeDot={{ r: 7, strokeWidth: 0, fill: "#475569" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
