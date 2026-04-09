"use client";

/*
Este archivo contiene el componente gráfico principal que permite visualizar la frecuencia de transacciones diarias para un usuario específico.
Muestra un gráfico interactivo estilo "área" filtrable temporalmente y sobrepone líneas referenciales en las fechas exactas en las que existió un contacto con el cliente.

Elementos externos:
- Recharts: biblioteca base que provee ejes, áreas interactivas y líneas referenciales para la construcción visual fluida del gráfico.

Funciones exportadas:
- UserTransactionChart: renderiza el gráfico adaptativo y gestiona de manera autónoma su propio estado interno de rango visual (7D, 14D, 30D, ALL), asegurando validaciones de historial.
*/

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { useState } from "react";

type TransactionSeries = {
  date: string;
  count: number;
};

interface UserTransactionChartProps {
  data: TransactionSeries[];
  className?: string;
  contactDates?: string[];
}

export default function UserTransactionChart({ data, className = "", contactDates = [] }: UserTransactionChartProps) {
  const maxHistoryDays = data.length;
  // Si la cantidad de días de historial desde la primera transacción es menor a 30, no habilitar los 3 botones temporales
  const hasEnoughHistory = maxHistoryDays >= 30;
  const [range, setRange] = useState<number>(hasEnoughHistory ? 30 : 0);

  // Format dates
  const chartData = data.map(d => ({
    ...d,
    formattedDate: new Date(d.date + "T00:00:00Z").toLocaleDateString("es-AR", { month: "short", day: "numeric", timeZone: "UTC" }),
  }));

  // Format contact dates to match chart XAxis values
  const formattedContactDates = Array.from(new Set(
    contactDates.map(dateStr => new Date(dateStr + "T00:00:00Z").toLocaleDateString("es-AR", { month: "short", day: "numeric", timeZone: "UTC" }))
  ));

  const filteredData = range === 0 ? chartData : chartData.slice(-Math.min(range, chartData.length));

  const calcDomain = (val: number, isMax: boolean) => {
    if (val === 0 || !val) return 0;
    const margin = Math.abs(val) * 0.15; // slightly more margin on top to make room for labels
    const target = isMax ? val + margin : val - margin;
    let step = 2;
    if (val > 10) step = 5;
    if (val > 50) step = 10;
    if (val > 100) step = 20;

    let rounded = isMax
      ? Math.ceil(target / step) * step
      : Math.floor(target / step) * step;

    if (!isMax && target >= 0 && rounded < 0) return 0;
    return rounded;
  };

  const TimeButtons = () => {
    return (
      <div className="flex bg-lux-surface border border-lux-hover/60 rounded-md p-1 shadow-sm antialiased gap-1">
        {[
          { label: "7D", value: 7 },
          { label: "14D", value: 14 },
          { label: "30D", value: 30 },
          { label: "ALL", value: 0 },
        ].map((btn) => {
          const disabled = !hasEnoughHistory && btn.value !== 0;
          return (
            <button
              key={btn.label}
              onClick={() => !disabled && setRange(btn.value)}
              disabled={disabled}
              title={disabled ? "Historial insuficiente (<30 días)" : undefined}
              className={`px-2 py-1 text-[9px] sm:px-3 sm:py-1 sm:text-[10px] font-semibold tracking-wide rounded transition-colors ${
                range === btn.value 
                  ? "bg-lux-gold/20 text-lux-gold" 
                  : disabled 
                    ? "text-lux-muted/30 cursor-not-allowed" 
                    : "text-lux-muted hover:text-white hover:bg-lux-hover/30"
              }`}
            >
              {btn.label}
            </button>
          );
        })}
      </div>
    );
  };

  type TooltipEntry = { color?: string; name?: string; value?: string | number; dataKey?: string };
  type CustomTooltipProps = { active?: boolean; payload?: TooltipEntry[]; label?: string };

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const isContactDay = formattedContactDates.includes(label || "");
      return (
        <div className="bg-lux-surface/90 backdrop-blur-md border border-lux-hover/60 p-3 flex flex-col gap-2 rounded-xl shadow-2xl text-xs z-50 min-w-[150px]">
          <p className="text-white font-semibold opacity-90 mb-1 border-b border-lux-hover/50 pb-1 flex justify-between items-center">
            {label}
            {isContactDay && <span className="ml-2 text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-400/30">Contactado</span>}
          </p>
          {payload.map((entry: TooltipEntry, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: entry.color, color: entry.color }}></span>
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
    <div className={`bg-lux-surface p-4 md:p-5 w-full h-full flex flex-col ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-4 gap-3 shrink-0">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold tracking-tight text-white drop-shadow-sm flex items-center whitespace-nowrap">
            <span className="w-1.5 h-4 bg-lux-gold rounded-full mr-2"></span>
            Transacciones Diarias
          </h3>
          {formattedContactDates.length > 0 && (
            <div className="flex items-center gap-1.5 ml-3.5 opacity-80 mt-1">
              <span className="w-3 h-[2px] bg-indigo-400 border-t border-dashed border-indigo-400"></span>
              <span className="text-[9px] text-lux-muted uppercase tracking-wider font-bold">Historial de Contacto</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-start sm:justify-end">
          <TimeButtons />
        </div>
      </div>
      <div className="flex-1 w-full min-h-[150px]">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
              <XAxis dataKey="formattedDate" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} minTickGap={20} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} domain={[(dataMin: number) => calcDomain(dataMin, false), (dataMax: number) => calcDomain(dataMax, true)]} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
              
              {formattedContactDates.map((date, i) => (
                <ReferenceLine 
                  key={`ref-${i}`} 
                  x={date} 
                  stroke="#818cf8" // indigo-400 equivalent for good visibility on dark
                  strokeDasharray="4 4" 
                  strokeWidth={2}
                  opacity={0.7}
                />
              ))}

              <Area type="monotone" dataKey="count" name="Transacciones" stroke="#d4af37" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} activeDot={{ r: 6, strokeWidth: 0, fill: "#b8962e", strokeOpacity: 0.2 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full opacity-60">
             <div className="w-8 h-8 rounded-full border border-lux-hover/50 flex items-center justify-center mb-2 bg-lux-surface shadow-inner">
               <span className="text-lux-gold text-base font-serif italic">i</span>
             </div>
            <p className="text-white text-xs">Sin datos recientes</p>
          </div>
        )}
      </div>
    </div>
  );
}
