/*
Endpoint GET /api/features/breakdown
Devuelve registros paginados para el día seleccionado en el gráfico.
Autentica al admin antes de leer datos.
*/

import { NextRequest, NextResponse } from "next/server";
import { assertAuthenticatedAdmin } from "@/app/lib/auth";
import { isValidFeatureId, isValidDimension, type FeatureId, type FeatureDimension } from "@/app/lib/features.config";
import { getFeatureBreakdown } from "@/app/services/features.service";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  try {
    await assertAuthenticatedAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const featureId = searchParams.get("featureId") ?? "";
  const dimension = searchParams.get("dimension") ?? "";
  const date = searchParams.get("date") ?? "";
  const pageRaw = parseInt(searchParams.get("page") ?? "1", 10);
  const page = isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;

  if (!isValidFeatureId(featureId)) {
    return NextResponse.json({ error: "featureId inválido." }, { status: 400 });
  }
  if (!isValidDimension(dimension)) {
    return NextResponse.json({ error: "dimension inválida." }, { status: 400 });
  }
  if (!DATE_REGEX.test(date)) {
    return NextResponse.json({ error: "date debe ser YYYY-MM-DD." }, { status: 400 });
  }

  try {
    const result = await getFeatureBreakdown(
      featureId as FeatureId,
      dimension as FeatureDimension,
      date,
      page
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al cargar breakdown." },
      { status: 500 }
    );
  }
}
