/*
Este archivo expone los servicios para interactuar con la base de datos de manera limpia,
específicamente para obtener las métricas del dashboard desde la tabla `metric_daily`.

Elementos externos:
- prisma: instancia del cliente de base de datos para realizar las consultas.

Funciones exportadas:
- getDashboardMetrics: Obtiene las métricas de los últimos X días, ordenadas por fecha de manera ascendente para ser dibujadas en los gráficos. Devuelve también el último registro como referencia rápida.
*/
import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

export async function getDashboardMetrics(days = 30) {
  const query: Prisma.metric_dailyFindManyArgs = {
    orderBy: {
      date: 'desc',
    },
  };

  if (days > 0) {
    query.take = days;
  }

  const metrics = await prisma.metric_daily.findMany(query);

  // Revert order for chart display (oldest to newest)
  const chartData = metrics.reverse();
  const latestMetric = chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const previousMetric = chartData.length > 1 ? chartData[chartData.length - 2] : null;

  return {
    chartData,
    latestMetric,
    previousMetric,
  };
}
