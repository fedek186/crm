"use client";

/*
Este archivo renderiza el gráfico principal de uso de features a lo largo del tiempo.
Fetcha /api/features/chart al cambiar feature, dimensión o rango de días.
Al hacer click en una barra notifica al coordinador el día seleccionado para el breakdown.

Elementos externos:
- Recharts: biblioteca de gráficos (ComposedChart con barras + línea de promedio).

Funciones exportadas:
- FeatureChart: gráfico interactivo con selección de feature, dimensión y rango temporal.
*/

import {
  ComposedChart,
  Bar,
  Cell,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { FEATURE_REGISTRY, type FeatureId, type FeatureDimension, type ChartPoint } from "@/app/lib/features.config";

type Props = {
  selectedDay: string | null;
  onDayClick: (day: string | null) => void;
  onFeatureChange: (id: FeatureId) => void;
  onDimensionChange: (dim: FeatureDimension) => void;
};

const DAYS_OPTIONS = [7, 14, 30] as const;

export default function FeatureChart({ selectedDay, onDayClick, onFeatureChange, onDimensionChange }: Props) {
  const [featureId, setFeatureId] = useState<FeatureId>("split_expenses");
  const [dimension, setDimension] = useState<FeatureDimension>("users");
  const [days, setDays] = useState<7 | 14 | 30>(30);
  const [rawData, setRawData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeFeature = FEATURE_REGISTRY.find((f) => f.id === featureId) ?? FEATURE_REGISTRY[0];;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/features/chart?featureId=${featureId}&dimension=${dimension}&days=${days}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        if (json.error) { setError(json.error); return; }
        setRawData(json.data ?? []);
      })
      .catch((e: unknown) => { if (e instanceof Error && e.name !== "AbortError") setError("Error al cargar el gráfico."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [featureId, dimension, days]);

  const avg = rawData.length > 0
    ? rawData.reduce((acc, p) => acc + p.value, 0) / rawData.length
    : 0;

  const chartData = rawData.map((p) => ({ ...p, avg: parseFloat(avg.toFixed(1)) }));

  const handleFeatureChange = (id: FeatureId) => {
    setFeatureId(id);
    onFeatureChange(id);
  };

  const handleDimensionChange = (dim: FeatureDimension) => {
    setDimension(dim);
    onDimensionChange(dim);
  };

  return (
    <div className="bg-lux-surface rounded-xl border border-lux-hover/40 shadow-2xl p-6">
      {/* Controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {FEATURE_REGISTRY.map((f) => (
            <button
              key={f.id}
              onClick={() => handleFeatureChange(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-colors ${
                featureId === f.id
                  ? "border-lux-gold/60 text-lux-gold bg-lux-gold/10"
                  : "border-lux-hover/40 text-lux-sec hover:border-lux-hover/70"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex rounded-lg border border-lux-hover/40 overflow-hidden text-xs">
            {(["users", "count"] as FeatureDimension[]).map((dim) => (
              <button
                key={dim}
                onClick={() => handleDimensionChange(dim)}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  dimension === dim
                    ? "bg-lux-gold/20 text-lux-gold"
                    : "text-lux-sec hover:bg-lux-hover/20"
                }`}
              >
                {dim === "users" ? "Usuarios únicos" : "Cantidad"}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-lux-hover/40 overflow-hidden text-xs">
            {DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  days === d
                    ? "bg-lux-gold/20 text-lux-gold"
                    : "text-lux-sec hover:bg-lux-hover/20"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico */}
      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lux-gold" />
            <p className="text-lux-sec text-xs">Cargando datos...</p>
          </div>
        </div>
      ) : error ? (
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : rawData.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-lux-muted text-sm">Sin datos para el período seleccionado.</p>
        </div>
      ) : (
        <div
          onClick={(e) => {
            const target = e.target as SVGElement;
            const isBar = target.closest(".recharts-bar-rectangle") !== null;
            if (!isBar) onDayClick(null);
          }}
        >
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#707070", fontSize: 10 }}
              tickFormatter={(v) => v.slice(5)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#707070", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f1f1f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
              labelStyle={{ color: "#c3c3c3", fontSize: 11 }}
              itemStyle={{ color: activeFeature.color, fontSize: 12 }}
              formatter={(val) => [val ?? 0, dimension === "users" ? "Usuarios únicos" : "Cantidad"]}
            />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              style={{ cursor: "pointer" }}
              onClick={(data) => {
                const date = (data as unknown as { date?: string })?.date;
                if (!date) return;
                onDayClick(date === selectedDay ? null : date);
              }}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.date}
                  fill={activeFeature.color}
                  opacity={selectedDay && selectedDay !== entry.date ? 0.35 : 0.85}
                />
              ))}
            </Bar>
            <Line
              dataKey="avg"
              stroke="rgba(255,255,255,0.3)"
              strokeDasharray="4 4"
              dot={false}
              activeDot={false}
              strokeWidth={1.5}
            />
          </ComposedChart>
        </ResponsiveContainer>
        </div>
      )}

      {selectedDay && (
        <p className="text-xs text-lux-muted mt-3 text-center">
          Mostrando detalle del <span className="text-lux-gold font-medium">{selectedDay}</span>
          {" "}— hacé click en otra barra para cambiar, o en el breakdown para cerrar.
        </p>
      )}
    </div>
  );
}
