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
  const { chartData, latestMetric, previousMetric } = await getDashboardMetrics(0);



  return (
    <div className="min-h-screen bg-lux-bg text-lux-text p-6 md:p-10 selection:bg-lux-gold selection:text-lux-bg">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end gap-3 mb-10">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-sm flex items-center gap-3">Dashboard</h1>
          {latestMetric?.date && (
            <p className="text-lux-sec text-sm pb-1 font-medium bg-lux-surface/50 border border-lux-hover/30 px-3 py-1.5 rounded-lg inline-flex items-center">
              Datos al {new Date(latestMetric.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })}
            </p>
          )}
        </div>

        {/* Tarjetas de Resumen KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Card 1: Usuarios Totales */}
          <div className="bg-lux-surface rounded-xl shadow-2xl border border-lux-hover/40 p-6 flex flex-col justify-between hover:border-lux-hover/60 transition-colors">
            <h4 className="text-xs text-lux-muted font-bold uppercase tracking-widest mb-3">Total Usuarios</h4>
            <div className="flex items-center">
              <span className="text-3xl lg:text-4xl font-bold text-white leading-none">
                {latestMetric?.total_users?.toLocaleString() || "0"}
              </span>
            </div>
            <p className="text-xs text-lux-sec mt-3 border-t border-lux-hover/30 pt-3">Registrados hasta la fecha actual</p>
          </div>

          {/* Card 2: Usuarios Activos 7d */}
          <div className="bg-lux-surface rounded-xl shadow-2xl border border-lux-hover/40 p-6 flex flex-col justify-between hover:border-lux-hover/60 transition-colors">
            <h4 className="text-xs text-lux-muted font-bold uppercase tracking-widest mb-3">Activos (7d)</h4>
            <div className="flex items-center">
              <span className="text-3xl lg:text-4xl font-bold text-white leading-none">
                {latestMetric?.active_users_7d?.toLocaleString() || "0"}
              </span>
            </div>
            <p className="text-xs text-lux-sec mt-3 border-t border-lux-hover/30 pt-3">Usuarios operando esta semana</p>
          </div>

          {/* Card 3: Nuevos usuarios */}
          <div className="bg-lux-surface rounded-xl shadow-2xl border border-lux-hover/40 p-6 flex flex-col justify-between hover:border-lux-hover/60 transition-colors">
            <h4 className="text-xs text-lux-muted font-bold uppercase tracking-widest mb-3">Nuevos Usuarios</h4>
            <div className="flex items-center">
              <span className="text-3xl lg:text-4xl font-bold text-white leading-none">
                {latestMetric?.new_users?.toLocaleString() || "0"}
              </span>
            </div>
            <p className="text-xs text-lux-sec mt-3 border-t border-lux-hover/30 pt-3">Recien registrados</p>
          </div>

          {/* Card 4: Engagement */}
          <div className="bg-lux-surface rounded-xl shadow-2xl border border-lux-hover/40 p-6 flex flex-col justify-between hover:border-lux-hover/60 transition-colors">
            <h4 className="text-xs text-lux-muted font-bold uppercase tracking-widest mb-3">Tx / Usuario Activo</h4>
            <div className="flex items-center">
              <span className="text-3xl lg:text-4xl font-bold text-white leading-none">
                {latestMetric?.avg_transactions_per_active_user?.toFixed(2) || "0"}
              </span>
            </div>
            <p className="text-xs text-lux-sec mt-3 border-t border-lux-hover/30 pt-3">Métrica de fidelización / engagement</p>
          </div>
        </div>

        {/* Gráficos en Client Component cargados asíncronamente */}
        {chartData.length > 0 ? (
          <DashboardCharts data={chartData} />
        ) : (
          <div className="w-full py-16 flex flex-col items-center justify-center bg-lux-surface rounded-xl shadow-2xl border border-lux-hover/30 text-lux-sec">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 mb-4"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            <p className="text-lg font-medium text-white mb-1">Sin datos estadísticos</p>
            <p className="text-sm">No exiten registros en la tabla metric_daily suficientes.</p>
          </div>
        )}

      </div>
    </div>
  );
}
