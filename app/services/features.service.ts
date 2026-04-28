/*
Este archivo provee la capa de acceso a datos para el módulo de analytics de features.
Consulta las tablas transaction_splits e installment_plans en Supabase usando service role
(bypasea RLS) y agrega los datos en JS para producir series de tiempo y breakdowns paginados.

Usa service role porque estas tablas tienen RLS activo y el CRM admin no tiene policy de lectura total.
El admin es autenticado antes de invocar estas funciones — la autenticación ocurre en la capa de API.

Funciones exportadas:
- getFeatureChartData: devuelve una serie de puntos agrupados por día para graficar.
- getFeatureBreakdown: devuelve registros paginados para el día seleccionado en el gráfico.
*/

import { createServiceRoleSupabaseClient } from "@/app/lib/supabase";
import type { ChartPoint, FeatureDimension, FeatureId } from "@/app/lib/features.config";

export const PAGE_SIZE = 25;
const MAX_ROWS = 10000;

export type BreakdownItem = {
  email: string | null;
  label: string;
  secondary?: string;
};

export type BreakdownResult = {
  items: BreakdownItem[];
  totalCount: number;
  page: number;
};

function toDateKey(isoString: string): string {
  return isoString.split("T")[0];
}

function fillDateRange(data: ChartPoint[], days: number): ChartPoint[] {
  const filled: ChartPoint[] = [];
  const dataMap = new Map(data.map((p) => [p.date, p.value]));
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    filled.push({ date: key, value: dataMap.get(key) ?? 0 });
  }
  return filled;
}

function getDayRange(date: string): { gte: string; lt: string } {
  const d = new Date(`${date}T00:00:00.000Z`);
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + 1);
  return {
    gte: d.toISOString(),
    lt: next.toISOString(),
  };
}

// ─── transaction_splits ──────────────────────────────────────────────

async function getSplitsChartData(dimension: FeatureDimension, days: number): Promise<ChartPoint[]> {
  const supabase = createServiceRoleSupabaseClient();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: splits, error } = await supabase
    .from("transaction_splits")
    .select("transaction_id, created_at")
    .is("deleted_at", null)
    .gte("created_at", startDate)
    .limit(MAX_ROWS);

  if (error) throw new Error(error.message);
  if (!splits || splits.length === 0) return [];

  if (dimension === "count") {
    const byDate = new Map<string, number>();
    for (const s of splits) {
      if (!s.created_at) continue;
      const key = toDateKey(s.created_at);
      byDate.set(key, (byDate.get(key) ?? 0) + 1);
    }
    return Array.from(byDate.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // dimension === "users": necesitamos el user_id desde transactions
  const txIds = [...new Set(splits.map((s) => s.transaction_id).filter(Boolean))] as string[];
  if (txIds.length === 0) return [];

  const { data: transactions, error: txError } = await supabase
    .from("transactions")
    .select("id, user_id")
    .in("id", txIds);

  if (txError) throw new Error(txError.message);

  const txUserMap = new Map<string, string>(
    (transactions ?? [])
      .filter((t): t is { id: string; user_id: string } =>
        typeof t.id === "string" && typeof t.user_id === "string"
      )
      .map((t) => [t.id, t.user_id])
  );

  const byDate = new Map<string, Set<string>>();
  for (const s of splits) {
    if (!s.created_at || !s.transaction_id) continue;
    const userId = txUserMap.get(s.transaction_id);
    if (!userId) continue;
    const key = toDateKey(s.created_at);
    if (!byDate.has(key)) byDate.set(key, new Set());
    byDate.get(key)!.add(userId);
  }

  return Array.from(byDate.entries())
    .map(([date, users]) => ({ date, value: users.size }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function getSplitsBreakdown(
  dimension: FeatureDimension,
  date: string,
  page: number
): Promise<BreakdownResult> {
  const supabase = createServiceRoleSupabaseClient();
  const { gte, lt } = getDayRange(date);

  const { data: splits, error } = await supabase
    .from("transaction_splits")
    .select("id, transaction_id, amount, created_at")
    .is("deleted_at", null)
    .gte("created_at", gte)
    .lt("created_at", lt)
    .limit(MAX_ROWS);

  if (error) throw new Error(error.message);
  if (!splits || splits.length === 0) return { items: [], totalCount: 0, page };

  const txIds = [...new Set(splits.map((s) => s.transaction_id).filter(Boolean))] as string[];
  if (txIds.length === 0) return { items: [], totalCount: 0, page };

  const { data: transactions, error: txError } = await supabase
    .from("transactions")
    .select("id, user_id, description")
    .in("id", txIds);

  if (txError) throw new Error(txError.message);

  const userIds = [...new Set(
    (transactions ?? []).map((t) => t.user_id).filter(Boolean)
  )] as string[];

  const emailMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, email")
      .in("id", userIds);
    for (const u of users ?? []) {
      if (typeof u.id === "string" && typeof u.email === "string") {
        emailMap.set(u.id, u.email);
      }
    }
  }

  const txMap = new Map<string, { user_id: string | null; description: string | null }>(
    (transactions ?? [])
      .filter((t): t is { id: string; user_id: string | null; description: string | null } =>
        typeof t.id === "string"
      )
      .map((t) => [t.id, { user_id: t.user_id, description: t.description }])
  );

  let items: BreakdownItem[];

  if (dimension === "users") {
    const userUsage = new Map<string, { email: string | null; count: number }>();
    for (const s of splits) {
      const tx = txMap.get(s.transaction_id ?? "");
      const userId = tx?.user_id ?? null;
      const key = userId ?? "unknown";
      const prev = userUsage.get(key) ?? { email: emailMap.get(userId ?? "") ?? null, count: 0 };
      userUsage.set(key, { ...prev, count: prev.count + 1 });
    }
    const allUsers = Array.from(userUsage.values());
    const totalCount = allUsers.length;
    const start = (page - 1) * PAGE_SIZE;
    items = allUsers
      .sort((a, b) => b.count - a.count)
      .slice(start, start + PAGE_SIZE)
      .map((u) => ({ email: u.email, label: `${u.count} split${u.count !== 1 ? "s" : ""}` }));
    return { items, totalCount, page };
  }

  // dimension === "count"
  const totalCount = splits.length;
  const start = (page - 1) * PAGE_SIZE;
  items = splits
    .slice(start, start + PAGE_SIZE)
    .map((s) => {
      const tx = txMap.get(s.transaction_id ?? "");
      const email = emailMap.get(tx?.user_id ?? "") ?? null;
      const amountNum = s.amount != null ? parseFloat(String(s.amount)) : NaN;
      const amount = !isNaN(amountNum) ? `$${amountNum.toLocaleString("es-AR")}` : "-";
      return { email, label: amount, secondary: tx?.description ?? undefined };
    });

  return { items, totalCount, page };
}

// ─── installment_plans ───────────────────────────────────────────────

async function getPlansChartData(dimension: FeatureDimension, days: number): Promise<ChartPoint[]> {
  const supabase = createServiceRoleSupabaseClient();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: plans, error } = await supabase
    .from("installment_plans")
    .select("user_id, created_at")
    .gte("created_at", startDate)
    .limit(MAX_ROWS);

  if (error) throw new Error(error.message);
  if (!plans || plans.length === 0) return [];

  if (dimension === "count") {
    const byDate = new Map<string, number>();
    for (const p of plans) {
      if (!p.created_at) continue;
      const key = toDateKey(p.created_at);
      byDate.set(key, (byDate.get(key) ?? 0) + 1);
    }
    return Array.from(byDate.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  const byDate = new Map<string, Set<string>>();
  for (const p of plans) {
    if (!p.created_at || !p.user_id) continue;
    const key = toDateKey(p.created_at);
    if (!byDate.has(key)) byDate.set(key, new Set());
    byDate.get(key)!.add(p.user_id as string);
  }

  return Array.from(byDate.entries())
    .map(([date, users]) => ({ date, value: users.size }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function getPlansBreakdown(
  dimension: FeatureDimension,
  date: string,
  page: number
): Promise<BreakdownResult> {
  const supabase = createServiceRoleSupabaseClient();
  const { gte, lt } = getDayRange(date);

  const { data: plans, error } = await supabase
    .from("installment_plans")
    .select("id, user_id, total_amount, installments_count, description, status")
    .gte("created_at", gte)
    .lt("created_at", lt)
    .limit(MAX_ROWS);

  if (error) throw new Error(error.message);
  if (!plans || plans.length === 0) return { items: [], totalCount: 0, page };

  const userIds = [...new Set(plans.map((p) => p.user_id).filter(Boolean))] as string[];
  const emailMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, email")
      .in("id", userIds);
    for (const u of users ?? []) {
      if (typeof u.id === "string" && typeof u.email === "string") {
        emailMap.set(u.id, u.email);
      }
    }
  }

  let items: BreakdownItem[];

  if (dimension === "users") {
    const userUsage = new Map<string, { email: string | null; count: number }>();
    for (const p of plans) {
      const key = typeof p.user_id === "string" ? p.user_id : "unknown";
      const email = typeof p.user_id === "string" ? (emailMap.get(p.user_id) ?? null) : null;
      const prev = userUsage.get(key) ?? { email, count: 0 };
      userUsage.set(key, { email, count: prev.count + 1 });
    }
    const allUsers = Array.from(userUsage.values());
    const totalCount = allUsers.length;
    const start = (page - 1) * PAGE_SIZE;
    items = allUsers
      .sort((a, b) => b.count - a.count)
      .slice(start, start + PAGE_SIZE)
      .map((u) => ({ email: u.email, label: `${u.count} plan${u.count !== 1 ? "es" : ""}` }));
    return { items, totalCount, page };
  }

  const totalCount = plans.length;
  const start = (page - 1) * PAGE_SIZE;
  items = plans
    .slice(start, start + PAGE_SIZE)
    .map((p) => {
      const email = typeof p.user_id === "string" ? (emailMap.get(p.user_id) ?? null) : null;
      const totalNum = p.total_amount != null ? parseFloat(String(p.total_amount)) : NaN;
      const label = !isNaN(totalNum)
        ? `$${totalNum.toLocaleString("es-AR")} · ${p.installments_count}c`
        : `-`;
      return { email, label, secondary: `${p.description ?? "-"} · ${p.status}` };
    });

  return { items, totalCount, page };
}

// ─── Exports públicos ─────────────────────────────────────────────────

export async function getFeatureChartData(
  featureId: FeatureId,
  dimension: FeatureDimension,
  days: number
): Promise<ChartPoint[]> {
  let raw: ChartPoint[] = [];
  if (featureId === "split_expenses") raw = await getSplitsChartData(dimension, days);
  else if (featureId === "installments") raw = await getPlansChartData(dimension, days);
  return fillDateRange(raw, days);
}

export async function getFeatureBreakdown(
  featureId: FeatureId,
  dimension: FeatureDimension,
  date: string,
  page: number
): Promise<BreakdownResult> {
  if (featureId === "split_expenses") return getSplitsBreakdown(dimension, date, page);
  if (featureId === "installments") return getPlansBreakdown(dimension, date, page);
  return { items: [], totalCount: 0, page };
}
