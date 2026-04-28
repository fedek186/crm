/*
Endpoint GET /api/features/chart
Devuelve la serie de puntos agrupados por día para una feature y dimensión dada.
Autentica al admin antes de leer datos.
*/

import { NextRequest, NextResponse } from "next/server";
import { assertAuthenticatedAdmin } from "@/app/lib/auth";
import { isValidFeatureId, isValidDimension, type FeatureId, type FeatureDimension } from "@/app/lib/features.config";
import { getFeatureChartData } from "@/app/services/features.service";

const VALID_DAYS = [7, 14, 30];

export async function GET(request: NextRequest) {
  try {
    await assertAuthenticatedAdmin();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const featureId = searchParams.get("featureId") ?? "";
  const dimension = searchParams.get("dimension") ?? "";
  const daysParam = Number(searchParams.get("days") ?? "30");

  if (!isValidFeatureId(featureId)) {
    return NextResponse.json({ error: "featureId inválido." }, { status: 400 });
  }
  if (!isValidDimension(dimension)) {
    return NextResponse.json({ error: "dimension inválida." }, { status: 400 });
  }
  const days = VALID_DAYS.includes(daysParam) ? daysParam : 30;

  try {
    const data = await getFeatureChartData(featureId as FeatureId, dimension as FeatureDimension, days);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al cargar datos." },
      { status: 500 }
    );
  }
}
