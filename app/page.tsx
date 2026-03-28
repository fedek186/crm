/*
Este archivo renderiza el Dashboard principal de la aplicación.
Muestra las tarjetas de resumen (KPIs) en la parte superior y llama a los componentes
de gráficos dinámicamente para visualizar el estado y tendencias del negocio.

Elementos externos:
- getDashboardMetrics: Servicio para obtener las métricas de negocio desde la BD.
- next/dynamic: Permite importar asíncronamente los gráficos pesados de Recharts para mejorar rendimiento.
- DashboardCharts: Componente cliente que renderiza los gráficos (importado vía dynamic).

Funciones exportadas:
- Page: Renderiza de manera asíncrona la pantalla del Dashboard (es un React Server Component).
*/

import dynamic from "next/dynamic";
import { getDashboardMetrics } from "./services/dashboardService";

// Lazy loading del componente de gráficos por políticas de optimización de performance (regla 4).
// Recharts debe cargarse dinámicamente solo en el cliente, evitando inflar el bundle inicial del servidor.
const DashboardCharts = dynamic(() => import("./components/DashboardCharts"), {
  loading: () => (
    <div className="w-full h-[350px] flex items-center justify-center bg-lux-surface rounded-xl border border-lux-hover/30 p-8 shadow-2xl">
      <div className="flex flex-col items-center gap-4">
         <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-lux-gold"></div>
         <p className="text-lux-sec text-sm">Cargando métricas...</p>
      </div>
    </div>
  ),
});

export default async function Page() {
  const { chartData, latestMetric, previousMetric } = await getDashboardMetrics(30);

  // Helper para crear UI de porcentaje (verde/rojo) para la tendencia
  const renderTrend = (current: number | null | undefined, prev: number | null | undefined) => {
    if (typeof current !== 'number' || typeof prev !== 'number') return null;
    if (prev === 0) return null;
    const diff = current - prev;
    const isPositive = diff >= 0;
    const percentage = Math.abs((diff / prev) * 100).toFixed(1);

    return (
      <span className={`text-[12px] font-medium px-2 py-0.5 rounded-md ml-3 ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
        {isPositive ? '↗' : '↘'} {percentage}%
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-lux-bg text-lux-text p-6 md:p-10 selection:bg-lux-gold selection:text-lux-bg">
      <div className="max-w-[1600px] mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-10 tracking-tight text-white drop-shadow-sm flex items-center gap-3">Dashboard</h1>

        {/* Tarjetas de Resumen KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Card 1: Usuarios Totales */}
          <div className="bg-lux-surface rounded-xl shadow-2xl border border-lux-hover/40 p-6 flex flex-col justify-between">
            <h4 className="text-xs text-lux-muted font-bold uppercase tracking-widest mb-3">Total Usuarios</h4>
            <div className="flex items-center">
              <span className="text-3xl lg:text-4xl font-bold text-white leading-none">
                {latestMetric?.total_users?.toLocaleString() || "0"}
              </span>
              {renderTrend(latestMetric?.total_users, previousMetric?.total_users)}
            </div>
            <p className="text-xs text-lux-sec mt-3 border-t border-lux-hover/30 pt-3">Registrados hasta la fecha actual</p>
          </div>

          {/* Card 2: Usuarios Activos 7d */}
          <div className="bg-lux-surface rounded-xl shadow-2xl border border-lux-gold/20 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-lux-gold/40 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-lux-gold/5 rounded-full blur-3xl group-hover:bg-lux-gold/10 transition-colors"></div>
            <h4 className="text-xs text-lux-gold font-bold uppercase tracking-widest mb-3 relative z-10">Activos (7d)</h4>
            <div className="flex items-center relative z-10">
              <span className="text-3xl lg:text-4xl font-bold text-white leading-none">
                {latestMetric?.active_users_7d?.toLocaleString() || "0"}
              </span>
              {renderTrend(latestMetric?.active_users_7d, previousMetric?.active_users_7d)}
            </div>
            <p className="text-xs text-lux-sec mt-3 border-t border-lux-hover/30 pt-3 relative z-10">Usuarios operando esta semana</p>
          </div>

          {/* Card 3: Nuevas Transacciones */}
          <div className="bg-lux-surface rounded-xl shadow-2xl border border-lux-hover/40 p-6 flex flex-col justify-between">
            <h4 className="text-xs text-lux-muted font-bold uppercase tracking-widest mb-3">Tx (Ayer)</h4>
            <div className="flex items-center">
              <span className="text-3xl lg:text-4xl font-bold text-white leading-none">
                 {latestMetric?.new_transactions?.toLocaleString() || "0"}
              </span>
              {renderTrend(latestMetric?.new_transactions, previousMetric?.new_transactions)}
            </div>
            <p className="text-xs text-lux-sec mt-3 border-t border-lux-hover/30 pt-3">Volumen diario reciente</p>
          </div>

          {/* Card 4: Engagement */}
          <div className="bg-lux-surface rounded-xl shadow-2xl border border-lux-hover/40 p-6 flex flex-col justify-between">
            <h4 className="text-xs text-lux-muted font-bold uppercase tracking-widest mb-3">Tx / Usuario Activo</h4>
            <div className="flex items-center">
              <span className="text-3xl lg:text-4xl font-bold text-white leading-none">
                {latestMetric?.avg_transactions_per_active_user?.toFixed(2) || "0"}
              </span>
              {renderTrend(latestMetric?.avg_transactions_per_active_user, previousMetric?.avg_transactions_per_active_user)}
            </div>
            <p className="text-xs text-lux-sec mt-3 border-t border-lux-hover/30 pt-3">Métrica de fidelización / engagement</p>
          </div>
        </div>

        {/* Gráficos en Client Component cargados asíncronamente */}
        {chartData.length > 0 ? (
           <DashboardCharts data={chartData} />
        ) : (
          <div className="w-full py-16 flex flex-col items-center justify-center bg-lux-surface rounded-xl shadow-2xl border border-lux-hover/30 text-lux-sec">
             <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 mb-4"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
             <p className="text-lg font-medium text-white mb-1">Sin datos estadísticos</p>
             <p className="text-sm">No exiten registros en la tabla metric_daily suficientes.</p>
          </div>
        )}

      </div>
    </div>
  );
}
