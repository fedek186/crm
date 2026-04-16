/*
Este archivo define el Endpoint (Route Handler) del sistema destinado a ejecutarse
únicamente mediante un Cron Job automatizado por Vercel. 
Se encarga de sincronizar toda la información de transacciones y perfiles desde
Supabase hacia Neon (userSummary), y además computa la matemática diaria para guardar
los totales y promedios analíticos del día que acaba de finalizar en la tabla `metric_daily`.

Elementos externos:
- NextResponse: clase para retornar respuestas HTTP estandarizadas.
- @supabase/supabase-js: para invocar a Supabase con la key administrativa (Service Role).
- prisma: ORM para la escritura masiva e inyección de la data consolidada.

Protección:
- La ruta lee el header de Authorization para comparar el CRON_SECRET contra la variable de entorno,
asegurando que únicamente Vercel (o quien tenga la key) pueda invocar el proceso masivo.
*/
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic'; // Foco importante para evitar que Vercel cachee esta URL
export const maxDuration = 60; // Damos 60 segundos por si Supabase/Prisma demoran

export async function GET(request: Request) {
  console.log("CRON: Petición entrante desde:", request.headers.get("user-agent"));

  // 1. Verificación Estricta para evitar ejecuciones externas
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error("CRON: Acceso denegado. Token inválido o no enviado. Header recibido:", authHeader);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Conexión de Administrador a Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 500 });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log("CRON: Iniciando Sincronización...");

    // === PASO 1: EXTRAER TODOS LOS DATOS (Usuarios + Transacciones de Supabase) ===
    let allTransactions: any[] = [];

    let from = 0;
    const limit = 1000;
    let keepFetching = true;

    // A) Traer transacciones en chunks para sobreescribir límite (vital para >1000 txs)
    while (keepFetching) {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, user_id, created_at")
        .range(from, from + limit - 1);

      if (error) throw new Error(error.message);

      if (data && data.length > 0) {
        allTransactions = allTransactions.concat(data);
        from += limit;
      } else {
        keepFetching = false;
      }
    }

    // B) Traer lista final de usuarios y sus integraciones (MP)
    // Para simplificar User Summary, usamos el modelo relacional estándar
    const { data: usersData, error: usrErr } = await supabase.from("users").select(`
      id, email, name, surname, phone, country, created_at, user_integrations(id, created_at)
    `);

    if (usrErr) throw new Error(usrErr.message);

    // === PASO 2: CONSTRUCCIÓN Y ACTUALIZACIÓN DEL USER SUMMARY ===
    const now = new Date();
    // Horarios para los cálculos transaccionales por usuario:
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgoWindow = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgoWindow = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    const formattedPrismaSummary = (usersData || []).map((u: any) => {
      let daily = 0, week = 0, month = 0;
      const hasMP = Boolean(u.user_integrations?.length);

      // Contar sus transacciones filtrando del pool gigante por userId
      const userTx = allTransactions.filter((tx) => tx.user_id === u.id);
      
      let state = 'NeverUsed' as import('@prisma/client').UserState;
      if (userTx.length > 0) {
        const startTxDate = Math.min(...userTx.map((t: any) => new Date(t.created_at).getTime()));
        const lastTxDate = Math.max(...userTx.map((t: any) => new Date(t.created_at).getTime()));

        if (startTxDate >= sevenDaysAgoWindow) {
          state = 'New';
        } else if (lastTxDate >= sevenDaysAgoWindow) {
          state = 'Active';
        } else if (lastTxDate >= thirtyDaysAgoWindow) {
          state = 'AtRisk';
        } else {
          state = 'Churned';
        }
      }

      for (const tx of userTx) {
        if (!tx.created_at) continue;
        const txDate = new Date(tx.created_at).getTime();
        if (txDate >= startOfToday) daily += 1;
        if (txDate >= sevenDaysAgoWindow) week += 1;
        if (txDate >= thirtyDaysAgoWindow) month += 1;
      }

      return {
        user_id: String(u.id),
        email: u.email,
        name: u.name,
        surname: u.surname,
        phone: u.phone ? String(u.phone) : null,
        country: u.country,
        created_at: u.created_at ? new Date(u.created_at) : null,
        mp: hasMP,
        daily_trans: daily,
        week_trans: week,
        monthly_trans: month,
        last_update: new Date(),
        state: state
      };
    });

    if (formattedPrismaSummary.length > 0) {
      // Upsert transaccional por lotes (UserSummary)
      await Promise.all(
        formattedPrismaSummary.map((summary) =>
          prisma.userSummary.upsert({
            create: summary,
            update: summary,
            where: { user_id: summary.user_id },
          })
        )
      );
    }

    // === PASO 3: COMPUTO Y EXTRACCIÓN DE DAILY METRICS (Del día de ayer) ===
    // Dado que corre a las 00:00, "el día que termina" es ayer.
    const dayEnd = new Date(now);
    dayEnd.setUTCHours(0, 0, 0, 0);       // Empezar a media noche (hoy en UTC)
    dayEnd.setMilliseconds(-1);           // Mover un milisegundo al pasado (23:59:59.999 UTC de Ayer)

    const dayStart = new Date(dayEnd);
    dayStart.setUTCHours(0, 0, 0, 0);     // (00:00:00.000 UTC de Ayer)

    const period7D = new Date(dayEnd);
    period7D.setDate(period7D.getDate() - 7); // Historial de los 7 días activos

    // Parsers para fechas de memoria super-rápidos
    const parsedUsers = (usersData || []).map(u => ({ created_at: new Date(u.created_at).getTime() }));
    const parsedTxs = allTransactions.map(t => ({ user_id: t.user_id, created_at: new Date(t.created_at).getTime() }));
    const parsedIntegrations = (usersData || []).flatMap((u: any) => u.user_integrations || []).map((i: any) => ({ created_at: new Date(i.created_at).getTime() }));

    // Calcular las 7 métricas clave para el día finalizado
    const total_users = parsedUsers.filter(u => u.created_at <= dayEnd.getTime()).length;
    const new_users = parsedUsers.filter(u => u.created_at >= dayStart.getTime() && u.created_at <= dayEnd.getTime()).length;
    const total_transactions = parsedTxs.filter(t => t.created_at <= dayEnd.getTime()).length;
    const new_transactions = parsedTxs.filter(t => t.created_at >= dayStart.getTime() && t.created_at <= dayEnd.getTime()).length;
    const total_integrations = parsedIntegrations.filter(i => i.created_at <= dayEnd.getTime()).length;

    const activeUsersSet = new Set<string>();
    parsedTxs.forEach((t) => {
      if (t.created_at > period7D.getTime() && t.created_at <= dayEnd.getTime()) activeUsersSet.add(t.user_id);
    });
    const active_users_7d = activeUsersSet.size;

    const avg_transactions_per_user = total_users > 0 ? (total_transactions / total_users) : 0;
    const avg_transactions_per_active_user = active_users_7d > 0 ? (new_transactions / active_users_7d) : 0;

    // Crear o asegurar que guardamos la métrica
    await prisma.metric_daily.upsert({
      where: { date: dayStart },
      update: {}, // No sobre-escribe si justo se ejecuta dos veces sueltas, opcional
      create: {
        date: dayStart,
        total_users,
        new_users,
        active_users_7d,
        total_transactions,
        new_transactions,
        avg_transactions_per_user,
        avg_transactions_per_active_user,
        total_integrations
      }
    });

    // Guardar log final del refreshRuns
    await prisma.refreshRuns.create({ data: { date: new Date() } });

    console.log("CRON: ¡Sincronización de Base y Métricas completada!");
    return NextResponse.json({ success: true, timestamp: new Date() }, { status: 200 });
  } catch (error: any) {
    console.error("CRON ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
