/*
Endpoint temporal de descubrimiento de schema.
Hace select(*).limit(3) en transaction_splits e installment_plans para revelar
las columnas reales antes de construir el servicio de datos.
Solo accesible para admins autenticados.
*/

import { NextResponse } from "next/server";
import { assertAuthenticatedAdmin, createAuthenticatedSupabaseClient } from "@/app/lib/auth";

export async function GET() {
  try {
    await assertAuthenticatedAdmin();
    const supabase = await createAuthenticatedSupabaseClient();

    const [splitsResult, plansResult] = await Promise.all([
      supabase.from("transaction_splits").select("*").limit(3),
      supabase.from("installment_plans").select("*").limit(3),
    ]);

    return NextResponse.json({
      transaction_splits: {
        error: splitsResult.error?.message ?? null,
        columns: splitsResult.data?.[0] ? Object.keys(splitsResult.data[0]) : [],
        sample: splitsResult.data ?? [],
      },
      installment_plans: {
        error: plansResult.error?.message ?? null,
        columns: plansResult.data?.[0] ? Object.keys(plansResult.data[0]) : [],
        sample: plansResult.data ?? [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 401 }
    );
  }
}
