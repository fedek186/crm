/*
Este script de una sola ejecución (one-off) rellena históricamente la tabla `metric_daily`.
Se conecta a Supabase para obtener la lista completa de usuarios y transacciones (utilizando paginación
para las transacciones y evadiendo el límite de 1000 de la API REST), y luego reconstruye la cronología 
día por día agrupando la data histórica. Calcula métricas acumulativas y diarias de usuarios y transacciones, 
inyectándolas finalmente en Neon (Prisma) en modo bulk insert.

Elementos externos:
- @supabase/supabase-js: Cliente para consultas a Supabase mediante la clave Service Role.
- PrismaClient: Para crear una nueva instancia local independiente de Next.js y enviar los datos.
- dotenv: Lee .env para mapear credenciales fuera del runtime del framework web.

Funciones principales:
- fetchAllTransactions: Extrae todas las transacciones usando un ciclo por offsets (range).
- fetchAllUsers: Extrae todos los usuarios registrados.
- runBackfill: Ejecuta la extracción de datos, iteración del tiempo, agrupación por intervalos diarios y escritura a base de datos.
*/

import * as dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Inicializamos clientes
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Service role key de auth admin

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials in .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { schema: "PiggyWareHouse" });
const prisma = new PrismaClient({ adapter });

interface UserRow {
  id: string;
  created_at: string;
}

interface TransactionRow {
  id: string;
  user_id: string;
  created_at: string;
}

async function fetchAllUsers(): Promise<UserRow[]> {
  const { data, error } = await supabase.from("users").select("id, created_at");
  if (error) throw new Error("Users fetch error: " + error.message);
  return data as UserRow[];
}

async function fetchAllTransactions(): Promise<TransactionRow[]> {
  let allData: TransactionRow[] = [];
  let from = 0;
  const limit = 1000;
  let keepFetching = true;

  while (keepFetching) {
    const { data, error } = await supabase
      .from("transactions")
      .select("id, user_id, created_at")
      .gte("created_at", "2025-05-23T00:00:00.000Z") // Filtro solicitado por bug en datos históricos
      .range(from, from + limit - 1);

    if (error) throw new Error("Transactions fetch error: " + error.message);

    if (data && data.length > 0) {
      allData = allData.concat(data as TransactionRow[]);
      from += limit;
    } else {
      keepFetching = false;
    }
  }

  return allData;
}

async function fetchAllIntegrations(): Promise<{id: string; created_at: string}[]> {
  let allData: {id: string; created_at: string}[] = [];
  let from = 0;
  const limit = 1000;
  let keepFetching = true;

  while (keepFetching) {
    const { data, error } = await supabase
      .from("user_integrations")
      .select("id, created_at")
      .range(from, from + limit - 1);

    if (error) throw new Error("Integrations fetch error: " + error.message);

    if (data && data.length > 0) {
      allData = allData.concat(data);
      from += limit;
    } else {
      keepFetching = false;
    }
  }

  return allData;
}

async function runBackfill() {
  console.log("-> Iniciando extracción desde Supabase...");
  const users = await fetchAllUsers();
  const transactions = await fetchAllTransactions();
  const integrations = await fetchAllIntegrations();
  console.log(`-> Obtuvimos ${users.length} usuarios, ${transactions.length} transacciones y ${integrations.length} integraciones.`);

  if (users.length === 0) {
    console.log("No hay usuarios para procesar.");
    return;
  }

  // Parse dates to timestamp for faster math
  const parsedUsers = users.map((u) => ({
    id: u.id,
    created_at: new Date(u.created_at).getTime(),
  }));

  const parsedTxs = transactions.map((t) => ({
    id: t.id,
    user_id: t.user_id,
    created_at: new Date(t.created_at).getTime(),
  }));

  const parsedIntegrations = integrations.map((i) => ({
    id: i.id,
    created_at: new Date(i.created_at).getTime(),
  }));

  // Encontrar la fecha mínima absoluta para empezar el ciclo histórico
  const minUserDate = Math.min(...parsedUsers.map((u) => u.created_at));
  const minTxDate = parsedTxs.length > 0 ? Math.min(...parsedTxs.map((t) => t.created_at)) : minUserDate;
  const startTimestamp = Math.min(minUserDate, minTxDate);

  // Crear objeto fecha usando el timezone local del server, arrancando a las 00:00:00
  const startDate = new Date(startTimestamp);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999); // Finaliza al final del día de "hoy"

  const metricsToInsert = [];

  console.log(`-> Recorriendo tiempo desde ${startDate.toLocaleDateString()} hasta ${endDate.toLocaleDateString()}`);

  // Iterar día por día
  let currentDate = new Date(startDate);
  
  while (currentDate.getTime() <= endDate.getTime()) {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const period7DaysAgo = new Date(dayEnd);
    period7DaysAgo.setDate(period7DaysAgo.getDate() - 7);

    // Filter rules
    const usersCreatedUpToDay = parsedUsers.filter((u) => u.created_at <= dayEnd.getTime());
    const total_users = usersCreatedUpToDay.length;

    const new_users = parsedUsers.filter(
      (u) => u.created_at >= dayStart.getTime() && u.created_at <= dayEnd.getTime()
    ).length;

    const txsUpToDay = parsedTxs.filter((t) => t.created_at <= dayEnd.getTime());
    const total_transactions = txsUpToDay.length;

    const new_transactions = parsedTxs.filter(
      (t) => t.created_at >= dayStart.getTime() && t.created_at <= dayEnd.getTime()
    ).length;

    const total_integrations = parsedIntegrations.filter(
      (i) => i.created_at <= dayEnd.getTime()
    ).length;

    const activeUsersSet = new Set<string>();
    parsedTxs.forEach((t) => {
      // Activos en últimos 7 días terminando en este día exacto
      if (t.created_at > period7DaysAgo.getTime() && t.created_at <= dayEnd.getTime()) {
        activeUsersSet.add(t.user_id);
      }
    });
    const active_users_7d = activeUsersSet.size;

    // Fórmulas promedios
    const avg_transactions_per_user = total_users > 0 ? total_transactions / total_users : 0;
    const avg_transactions_per_active_user = active_users_7d > 0 ? new_transactions / active_users_7d : 0;

    metricsToInsert.push({
      date: new Date(dayStart.getTime()), // Guardar un index representativo al inicio del dia
      total_users,
      new_users,
      active_users_7d,
      total_transactions,
      new_transactions,
      avg_transactions_per_user,
      avg_transactions_per_active_user,
      total_integrations,
    });

    // Avanzamos un día manual
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Insertar todo usando Prisma Batch
  console.log(`-> Limpiando métricas previas por seguridad...`);
  await prisma.metric_daily.deleteMany({}); // Reseteo para evitar mezcla de información vieja

  console.log(`-> Grabando ${metricsToInsert.length} días de métricas en Prisma...`);
  try {
    const res = await prisma.metric_daily.createMany({
      data: metricsToInsert,
      skipDuplicates: true, // Por prevención y evitar bloqueos de constraint "Unique date"
    });
    console.log(`-> Éxito! ${res.count} métricas históricas agregadas.`);
  } catch (error) {
    console.error("-> Error insertando a Neon:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecución nativa del handler
runBackfill().catch((e) => {
  console.error("Script Error General:", e);
  process.exit(1);
});
