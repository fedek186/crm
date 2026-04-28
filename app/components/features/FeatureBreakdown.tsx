"use client";

/*
Este archivo renderiza la tabla de detalle paginada para el día seleccionado en el gráfico.
Fetcha /api/features/breakdown cuando cambian featureId, dimensión, día o página.

Funciones exportadas:
- FeatureBreakdown: tabla paginada de registros del día seleccionado con email y datos de uso.
*/

import { useEffect, useState } from "react";
import type { FeatureId, FeatureDimension } from "@/app/lib/features.config";
import type { BreakdownItem } from "@/app/services/features.service";
import { PAGE_SIZE } from "@/app/services/features.service";

type Props = {
  featureId: FeatureId;
  dimension: FeatureDimension;
  selectedDay: string;
  onClose: () => void;
};


export default function FeatureBreakdown({ featureId, dimension, selectedDay, onClose }: Props) {
  const [items, setItems] = useState<BreakdownItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [featureId, dimension, selectedDay]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const url = `/api/features/breakdown?featureId=${featureId}&dimension=${dimension}&date=${selectedDay}&page=${page}`;
    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        if (json.error) { setError(json.error); return; }
        setItems(json.items ?? []);
        setTotalCount(json.totalCount ?? 0);
      })
      .catch((e: unknown) => { if (e instanceof Error && e.name !== "AbortError") setError("Error al cargar el detalle."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [featureId, dimension, selectedDay, page]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const colHeader = dimension === "users" ? "Usos" : "Detalle";

  return (
    <div className="bg-lux-surface rounded-xl border border-lux-hover/40 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-lux-hover/40">
        <div>
          <h2 className="text-white font-semibold text-sm">
            Detalle — <span className="text-lux-gold">{selectedDay}</span>
          </h2>
          {!loading && !error && (
            <p className="text-lux-muted text-xs mt-0.5">{totalCount} {totalCount === 1 ? "registro" : "registros"}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-lux-sec hover:text-white text-lg leading-none transition-colors"
          aria-label="Cerrar detalle"
        >
          ✕
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-lux-gold" />
        </div>
      ) : error ? (
        <div className="px-6 py-8 text-red-400 text-sm text-center">{error}</div>
      ) : items.length === 0 ? (
        <div className="px-6 py-8 text-lux-muted text-sm text-center">Sin registros para este día.</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-lux-hover/40 text-[11px] font-semibold uppercase tracking-widest text-lux-sec">
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">{colHeader}</th>
                  {dimension === "count" && <th className="px-6 py-3 text-left">Descripción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-lux-hover/20 font-light">
                {items.map((item, i) => (
                  <tr key={`${item.email ?? "unknown"}-${i}`} className="hover:bg-lux-hover/10 transition-colors">
                    <td className="px-6 py-3 text-lux-sec text-xs">{item.email ?? "-"}</td>
                    <td className="px-6 py-3 text-white">{item.label}</td>
                    {dimension === "count" && (
                      <td className="px-6 py-3 text-lux-muted text-xs">{item.secondary ?? "-"}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-lux-hover/40">
              <span className="text-xs text-lux-muted">Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 text-xs border border-lux-hover/40 rounded text-lux-sec hover:border-lux-hover/70 disabled:opacity-30 transition-colors"
                >
                  Anterior
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 text-xs border border-lux-hover/40 rounded text-lux-sec hover:border-lux-hover/70 disabled:opacity-30 transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
