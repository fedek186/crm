"use client";

/*
Este archivo contiene los componentes de gráficos para el Dashboard principal, utilizando Recharts.
Al ser un componente de cliente que incluye bibliotecas pesadas de gráficos, debe ser importado dinámicamente.

Elementos externos:
- Recharts: provee los componentes base para los gráficos.

Funciones exportadas:
- DashboardCharts: Renderiza los cuatro gráficos principales requeridos con sus derivaciones matemáticas matemáticas en vivo.
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
  ComposedChart
} from "recharts";
import { useState } from "react";

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
  total_integrations?: number | null;
};

interface DashboardChartsProps {
  data: MetricRecord[];
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
  // Format dates and calc mathematical derivations
  const baseChartData = data.map((d, index, array) => {
    const prev = index > 0 ? array[index - 1] : null;

    const calcGrowth = (curr: number | null | undefined, prevVal: number | null | undefined) => {
      if (!prevVal || prevVal === 0) return 0;
      return (((curr || 0) - prevVal) / prevVal) * 100;
    };

    const new_users_growth = calcGrowth(d.new_users, prev?.new_users);
    const new_transactions_growth = calcGrowth(d.new_transactions, prev?.new_transactions);

    const active_proportion = (d.total_users || 0) > 0
      ? ((d.active_users_7d || 0) / (d.total_users || 1)) * 100
      : 0;

    const integrations_proportion = (d.total_users || 0) > 0
      ? ((d.total_integrations || 0) / (d.total_users || 1)) * 100
      : 0;

    return {
      ...d,
      formattedDate: new Date(d.date).toLocaleDateString("es-AR", { month: "short", day: "numeric", timeZone: 'UTC' }),
      total_users: d.total_users || 0,
      new_users: d.new_users || 0,
      active_users_7d: d.active_users_7d || 0,
      new_transactions: d.new_transactions || 0,
      total_integrations: d.total_integrations || 0,
      avg_transactions_per_user: Math.round((d.avg_transactions_per_user || 0) * 100) / 100,
      avg_transactions_per_active_user: Math.round((d.avg_transactions_per_active_user || 0) * 100) / 100,
      new_users_growth: Math.round(new_users_growth * 10) / 10,
      new_transactions_growth: Math.round(new_transactions_growth * 10) / 10,
      active_proportion: Math.round(active_proportion * 10) / 10,
      integrations_proportion: Math.round(integrations_proportion * 10) / 10,
    };
  });

  // State for each individual chart timespan
  const [range1, setRange1] = useState<number>(30);
  const [range2, setRange2] = useState<number>(30);
  const [range3, setRange3] = useState<number>(30);
  const [range4, setRange4] = useState<number>(30);

  // Inner Toggles for metrics
  const [metric2, setMetric2] = useState<"percent" | "integer">("percent");
  const [metric3, setMetric3] = useState<"global" | "active">("global");
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});

  const toggleSeries = (dataKey: string) => {
    setHiddenSeries(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  };

  const chartData1 = range1 === 0 ? baseChartData : baseChartData.slice(-range1);
  const chartData2 = range2 === 0 ? baseChartData : baseChartData.slice(-range2);
  const chartData3 = range3 === 0 ? baseChartData : baseChartData.slice(-range3);
  const chartData4 = range4 === 0 ? baseChartData : baseChartData.slice(-range4);

  const calcDomain = (val: number, isMax: boolean) => {
    if (val === 0 || !val) return 0;

    // 10% margen (expandiendo hacia afuera tanto de min como max)
    const margin = Math.abs(val) * 0.10;
    const target = isMax ? val + margin : val - margin;

    // Determinar escalón iterativo del redondeo para mantener números lindos y escalables
    const absVal = Math.abs(val);
    let step = 10;
    if (absVal <= 10) step = 2; // de 0-10, encaja en rondas de 2 (ej: 0, 2, 4...)
    else if (absVal <= 100) step = 10; // de 10-100, encaja en 10 (ej: 10, 20...)
    else if (absVal <= 1000) step = 50; // de 100-1000, iterar en 50
    else step = 100; // >1000 iterar cada 100

    // Si es un máximo de gráfica, redondear SIEMPRE hacia arriba. Si es un mínimo, SIEMPRE hacia abajo.
    let rounded = isMax
      ? Math.ceil(target / step) * step
      : Math.floor(target / step) * step;

    // Asegurar que no cruzamos el propio cero accidentalmente si los datos eran estrictamente positivos o negativos
    if (!isMax && target >= 0 && rounded < 0) return 0;
    if (isMax && target <= 0 && rounded > 0) return 0;

    return rounded;
  };

  const TimeButtons = ({ range, setRange }: { range: number, setRange: (val: number) => void }) => {
    return (
      <div className="flex bg-lux-surface border border-lux-hover/60 rounded-md p-1 shadow-sm antialiased gap-1">
        {[
          { label: "7D", value: 7 },
          { label: "14D", value: 14 },
          { label: "30D", value: 30 },
          { label: "ALL", value: 0 },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={() => setRange(btn.value)}
            className={`px-3 py-1 text-[10px] sm:px-4 sm:py-1.5 sm:text-[11px] font-semibold tracking-wide rounded transition-colors ${range === btn.value ? "bg-lux-gold/20 text-lux-gold" : "text-lux-muted hover:text-white hover:bg-lux-hover/30"}`}
          >
            {btn.label}
          </button>
        ))}
      </div>
    );
  };

  const TypeToggle = ({ options, current, onChange }: { options: { label: string, value: string }[], current: string, onChange: (v: any) => void }) => (
    <div className="flex w-fit bg-lux-surface border border-lux-hover/40 rounded-lg p-0.5 shadow-sm text-[10px] sm:text-[11px] font-semibold mr-2 sm:mr-4">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 rounded-md transition-colors ${current === opt.value ? 'bg-lux-hover/50 text-white shadow-sm' : 'text-lux-muted hover:text-white'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  type TooltipEntry = { color?: string; name?: string; value?: string | number; dataKey?: string };
  type CustomTooltipProps = { active?: boolean; payload?: TooltipEntry[]; label?: string };

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-lux-surface/90 backdrop-blur-md border border-lux-hover/60 p-4 flex flex-col gap-3 rounded-xl shadow-2xl text-sm z-50 min-w-[170px]">
          <p className="text-white font-semibold opacity-90 mb-1 border-b border-lux-hover/50 pb-2">{label}</p>
          {payload.map((entry: TooltipEntry, index: number) => {
            const isPercent = entry.name?.includes("%") || entry.dataKey?.includes('growth') || entry.dataKey?.includes('proportion');
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: entry.color, color: entry.color }}></span>
                  <span className="text-lux-sec font-medium">{entry.name}</span>
                </div>
                <span className="text-white font-bold">{entry.value}{isPercent ? '%' : ''}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full relative">

      {/* Gráfico 1: Nuevos Usuarios */}
      <div className="bg-lux-surface rounded-xl shadow-2xl border border-lux-hover/40 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-6 gap-4">
          <div className="flex flex-col gap-3">
            <h3 className="text-lg md:text-xl font-bold tracking-tight text-white drop-shadow-sm flex items-center whitespace-nowrap">
              <span className="w-2 h-6 bg-lux-gold rounded-full mr-3"></span>
              Nuevos Usuarios
            </h3>
          </div>
          <div className="flex items-center justify-start sm:justify-end">
            <TimeButtons range={range1} setRange={setRange1} />
          </div>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData1} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#ffffff08" vertical={false} />
              <XAxis dataKey="formattedDate" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickMargin={14} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickMargin={14} domain={[(dataMin: number) => calcDomain(dataMin, false), (dataMax: number) => calcDomain(dataMax, true)]} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} />
              <Bar dataKey="new_users" name="Nuevos Usuarios" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 2: Usuarios Totales + % Activos */}
      <div className="bg-lux-surface rounded-xl shadow-2xl border border-lux-hover/40 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-6 gap-4">
          <div className="flex flex-col gap-3">
            <h3 className="text-lg md:text-xl font-bold tracking-tight text-white drop-shadow-sm flex items-center whitespace-nowrap">
              <span className="w-2 h-6 bg-[#14b8a6] rounded-full mr-3"></span>
              Total vs Activos
            </h3>
            <TypeToggle options={[{ label: "%", value: "percent" }, { label: "#", value: "integer" }]} current={metric2} onChange={setMetric2} />
          </div>
          <div className="flex items-center justify-start sm:justify-end">
            <TimeButtons range={range2} setRange={setRange2} />
          </div>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData2} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#ffffff08" vertical={false} />
              <XAxis dataKey="formattedDate" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickMargin={14} />
              <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickMargin={14} domain={[(dataMin: number) => calcDomain(dataMin, false), (dataMax: number) => calcDomain(dataMax, true)]} />
              {metric2 === "percent" && (
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickMargin={14} domain={[(dataMin: number) => calcDomain(dataMin, false), (dataMax: number) => calcDomain(dataMax, true)]} />
              )}
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff10', strokeWidth: 2 }} />
              <Legend verticalAlign="bottom" content={() => {
                const items = metric2 === "percent"
                  ? [{ key: 'total_users', name: 'Usuarios Totales', color: '#818cf8' }, { key: 'active_proportion', name: 'Activos %', color: '#10b981' }, { key: 'integrations_proportion', name: 'Integraciones %', color: '#f59e0b' }]
                  : [{ key: 'total_users', name: 'Usuarios Totales', color: '#818cf8' }, { key: 'active_users_7d', name: 'Usuarios Activos', color: '#10b981' }, { key: 'total_integrations', name: 'Integraciones', color: '#f59e0b' }];
                return (
                  <div className="flex justify-center flex-wrap gap-4 pt-5 text-[13px]">
                    {items.map(item => (
                      <div key={item.key} onClick={() => toggleSeries(item.key)} className={`flex items-center gap-1.5 cursor-pointer transition-opacity ${hiddenSeries[item.key] ? 'opacity-40' : 'opacity-100 hover:opacity-80'}`}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="text-lux-sec font-medium">{item.name}</span>
                      </div>
                    ))}
                  </div>
                );
              }} />
              {!hiddenSeries['total_users'] && <Area yAxisId="left" type="monotone" dataKey="total_users" name="Usuarios Totales" stroke="#818cf8" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} activeDot={{ r: 7, strokeWidth: 0, fill: "#6366f1" }} />}
              {metric2 === "percent" ? (
                <>
                  {!hiddenSeries['active_proportion'] && <Line yAxisId="right" type="monotone" dataKey="active_proportion" name="Activos %" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }} activeDot={{ r: 7, strokeWidth: 0, fill: "#059669" }} />}
                  {!hiddenSeries['integrations_proportion'] && <Line yAxisId="right" type="monotone" dataKey="integrations_proportion" name="Integraciones %" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }} activeDot={{ r: 7, strokeWidth: 0, fill: "#d97706" }} />}
                </>
              ) : (
                <>
                  {!hiddenSeries['active_users_7d'] && <Line yAxisId="left" type="monotone" dataKey="active_users_7d" name="Usuarios Activos" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }} activeDot={{ r: 7, strokeWidth: 0, fill: "#059669" }} />}
                  {!hiddenSeries['total_integrations'] && <Line yAxisId="left" type="monotone" dataKey="total_integrations" name="Integraciones" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }} activeDot={{ r: 7, strokeWidth: 0, fill: "#d97706" }} />}
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 3: Transacciones / Usuario */}
      <div className="bg-lux-surface rounded-xl shadow-2xl border border-lux-hover/40 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-6 gap-4">
          <div className="flex flex-col gap-3">
            <h3 className="text-lg md:text-xl font-bold tracking-tight text-white drop-shadow-sm flex items-center whitespace-nowrap">
              <span className="w-2 h-6 bg-slate-500 rounded-full mr-3"></span>
              Transacciones / Usuario
            </h3>
            <TypeToggle options={[{ label: "Global", value: "global" }, { label: "Activos", value: "active" }]} current={metric3} onChange={setMetric3} />
          </div>
          <div className="flex items-center justify-start sm:justify-end">
            <TimeButtons range={range3} setRange={setRange3} />
          </div>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData3} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#ffffff08" vertical={false} />
              <XAxis dataKey="formattedDate" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickMargin={14} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickMargin={14} domain={[(dataMin: number) => calcDomain(dataMin, false), (dataMax: number) => calcDomain(dataMax, true)]} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff10', strokeWidth: 2, strokeDasharray: '4 4' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} />

              {metric3 === "global" ? (
                <Line type="monotone" dataKey="avg_transactions_per_user" name="Tx / Usuario Global" stroke="#64748b" strokeWidth={3} dot={{ r: 4, fill: "#64748b", strokeWidth: 0 }} activeDot={{ r: 7, strokeWidth: 0, fill: "#475569" }} />
              ) : (
                <Line type="monotone" dataKey="avg_transactions_per_active_user" name="Tx / Usuario Activo" stroke="#14b8a6" strokeWidth={3} dot={{ r: 4, fill: "#14b8a6", strokeWidth: 0 }} activeDot={{ r: 7, strokeWidth: 0, fill: "#0d9488" }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 4: Nuevas Transacciones */}
      <div className="bg-lux-surface rounded-xl shadow-2xl border border-lux-hover/40 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-6 gap-4">
          <div className="flex flex-col gap-3">
            <h3 className="text-lg md:text-xl font-bold tracking-tight text-white drop-shadow-sm flex items-center whitespace-nowrap">
              <span className="w-2 h-6 bg-indigo-500 rounded-full mr-3"></span>
              Nuevas Transacciones
            </h3>
          </div>
          <div className="flex items-center justify-start sm:justify-end">
            <TimeButtons range={range4} setRange={setRange4} />
          </div>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData4} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#ffffff08" vertical={false} />
              <XAxis dataKey="formattedDate" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickMargin={14} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickMargin={14} domain={[(dataMin: number) => calcDomain(dataMin, false), (dataMax: number) => calcDomain(dataMax, true)]} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} />
              <Bar dataKey="new_transactions" name="Nuevas Transacciones" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
