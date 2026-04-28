/*
Este archivo provee los servicios encargados de la interacción con la base de datos para la entidad de usuarios.
Se encarga de recuperar los listados (ya sea desde Neon DB mediante Prisma o con fallback a Supabase),
manejar la lógica de paginación y filtrar la analítica en JavaScript (cuando hay parámetros de la interfaz). 
También obtiene los perfiles unificados detallados y el sumario temporal de transacciones.

Elementos externos:
- assertAuthenticatedAdmin, createAuthenticatedSupabaseClient: módulos de validación y acceso seguro a capas protegidas del backend.
- prisma: ORM para la conexión local y ejecución unificada en la base de datos principal PostgreSQL.

Funciones exportadas:
- getUsersFromNeon: obtiene la lista paginada y filtrada (vía código o búsqueda SQL) de los clientes/usuarios usando Prisma.
- getUserProfile: recupera la ficha detallada (incluyendo interacciones comerciales registradas) del perfil analítico del usuario.
- getUserTransactionHistory: recupera y agrupa los logs nativos de transacciones por fecha directamente consumiendo a Supabase, sirviendo matrices para interfaces analíticas.
*/
import { assertAuthenticatedAdmin, createAuthenticatedSupabaseClient } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { Prisma } from "@prisma/client";

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL);
}

type SupabaseUserRow = {
  country: string | null;
  created_at: string | null;
  email: string | null;
  id: string | number;
  name: string | null;
  phone: string | number | null;
  surname: string | null;
  transactions?: Array<{ date: string | null; id: string | number }> | null;
  user_integrations?: Array<{ id: string | number }> | null;
};

type FallbackUser = {
  _count: {
    contacts: number;
  };
  contacts: Array<{ start_date: Date | null }>;
  country: string | null;
  created_at: Date | null;
  daily_trans: number;
  email: string | null;
  id: string | number;
  last_update: Date | null;
  monthly_trans: number;
  mp: boolean;
  name: string | null;
  phone: string | null;
  surname: string | null;
  user_id: string;
  week_trans: number;
  state?: string | null;
  categories: number;
  accounts: number;
};

function buildUserMetrics(user: SupabaseUserRow) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  let daily_trans = 0;
  let week_trans = 0;
  let monthly_trans = 0;

  for (const tx of user.transactions ?? []) {
    if (!tx.date) {
      continue;
    }

    const transactionDate = new Date(tx.date).getTime();

    if (transactionDate >= startOfToday) {
      daily_trans += 1;
    }

    if (transactionDate >= sevenDaysAgo) {
      week_trans += 1;
    }

    if (transactionDate >= thirtyDaysAgo) {
      monthly_trans += 1;
    }
  }

  return {
    daily_trans,
    monthly_trans,
    mp: Boolean(user.user_integrations?.length),
    week_trans,
  };
}

function compareValues(left: unknown, right: unknown, sortDesc: boolean) {
  if (left === right) {
    return 0;
  }

  if (left == null) {
    return sortDesc ? 1 : -1;
  }

  if (right == null) {
    return sortDesc ? -1 : 1;
  }

  if (left instanceof Date && right instanceof Date) {
    return sortDesc ? right.getTime() - left.getTime() : left.getTime() - right.getTime();
  }

  if (typeof left === "number" && typeof right === "number") {
    return sortDesc ? right - left : left - right;
  }

  const normalizedLeft = String(left).toLowerCase();
  const normalizedRight = String(right).toLowerCase();

  return sortDesc
    ? normalizedRight.localeCompare(normalizedLeft)
    : normalizedLeft.localeCompare(normalizedRight);
}

async function getUsersFromSupabase(options: GetUsersOptions = {}) {
  const { limit = 50, page = 1, search = "", sortBy = "created_at", sortDesc = true } = options;
  const supabase = await createAuthenticatedSupabaseClient();
  const { data, error } = await supabase.from("users").select(`
      id,
      email,
      name,
      surname,
      phone,
      country,
      created_at,
      transactions(id, date),
      user_integrations(id)
    `);

  if (error) {
    console.error("Error al obtener usuarios desde Supabase:", error);
    return { totalCount: 0, totalPages: 0, users: [] };
  }

  const normalizedUsers: FallbackUser[] = ((data as SupabaseUserRow[] | null) ?? []).map((user) => {
    const metrics = buildUserMetrics(user);

    return {
      _count: { contacts: 0 },
      contacts: [],
      country: user.country,
      created_at: user.created_at ? new Date(user.created_at) : null,
      daily_trans: metrics.daily_trans,
      email: user.email,
      id: user.id,
      last_update: null,
      monthly_trans: metrics.monthly_trans,
      mp: metrics.mp,
      name: user.name,
      phone: user.phone ? String(user.phone) : null,
      surname: user.surname,
      user_id: String(user.id),
      week_trans: metrics.week_trans,
      state: null,
      categories: 0,
      accounts: 0,
    };
  });

  const loweredSearch = search.trim().toLowerCase();
  const filteredUsers = loweredSearch
    ? normalizedUsers.filter((user) =>
      [user.name, user.surname, user.email].some((value) =>
        String(value ?? "").toLowerCase().includes(loweredSearch)
      )
    )
    : normalizedUsers;

  const sortedUsers = [...filteredUsers].sort((left, right) => {
    if (sortBy === "contacts") {
      return compareValues(left._count.contacts, right._count.contacts, sortDesc);
    }

    return compareValues(left[sortBy as keyof FallbackUser], right[sortBy as keyof FallbackUser], sortDesc);
  });

  const totalCount = sortedUsers.length;
  const totalPages = Math.ceil(totalCount / limit);
  const skip = (page - 1) * limit;

  return {
    totalCount,
    totalPages,
    users: sortedUsers.slice(skip, skip + limit),
  };
}

async function getUserProfileFromSupabase(userId: string) {
  const supabase = await createAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select(`
      id,
      email,
      name,
      surname,
      phone,
      country,
      created_at,
      transactions(id, date),
      user_integrations(id)
    `)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error al obtener perfil desde Supabase:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  const metrics = buildUserMetrics(data as SupabaseUserRow);

  return {
    contacts: [],
    country: data.country,
    created_at: data.created_at ? new Date(data.created_at) : null,
    daily_trans: metrics.daily_trans,
    email: data.email,
    id: data.id,
    last_update: null,
    monthly_trans: metrics.monthly_trans,
    mp: metrics.mp,
    name: data.name,
    phone: data.phone ? String(data.phone) : null,
    surname: data.surname,
    user_id: String(data.id),
    week_trans: metrics.week_trans,
    state: null,
    categories: 0,
    accounts: 0,
  };
}

export interface GetUsersOptions {
  limit?: number;
  page?: number;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
  filterCol?: string;
  filterOp?: string;
  filterVal?: string;
}

function zeroSatisfiesFilter(op: string, val: number): boolean {
  switch (op) {
    case "eq": return val === 0;
    case "gt": return 0 > val;
    case "lt": return 0 < val;
    case "gte": return 0 >= val;
    case "lte": return 0 <= val;
    default: return false;
  }
}

function buildFilterWhere(filterCol: string, filterOp: string, filterVal: string): Prisma.userSummaryWhereInput {
  if (filterCol === "mp") {
    if (filterOp !== "eq") return {};
    return { mp: filterVal === "true" };
  }

  if (filterCol === "state") {
    const stateMap: Record<string, string> = {
      neverused: "NeverUsed",
      new: "New",
      active: "Active",
      activeplus: "ActivePlus",
      atrisk: "AtRisk",
      churned: "Churned",
    };
    const lower = filterVal.toLowerCase();
    if (filterOp === "eq") {
      if (lower === "") return { state: null };
      const v = stateMap[lower];
      return v ? { state: v as any } : { id: { lt: 0 } };
    }
    if (filterOp === "contains") {
      if (lower === "") return {};
      const matches = Object.entries(stateMap).filter(([k]) => k.includes(lower)).map(([, v]) => v);
      return matches.length > 0 ? { state: { in: matches as any[] } } : { id: { lt: 0 } };
    }
    return {};
  }

  const stringCols = ["name", "surname", "email", "country", "phone"];
  if (stringCols.includes(filterCol)) {
    const lower = filterVal.toLowerCase();
    if (filterOp === "contains") {
      if (lower === "") return {};
      return { [filterCol]: { contains: filterVal, mode: "insensitive" as const } };
    }
    if (filterOp === "eq") {
      if (lower === "") return { OR: [{ [filterCol]: null }, { [filterCol]: "" }] };
      return { [filterCol]: { equals: filterVal, mode: "insensitive" as const } };
    }
    return {};
  }

  if (filterCol === "created_at") {
    if (!filterVal) return { id: { lt: 0 } };
    const start = new Date(filterVal + "T00:00:00");
    const end = new Date(start.getTime() + 86400000);
    switch (filterOp) {
      case "eq": return { created_at: { gte: start, lt: end } };
      case "gt": return { created_at: { gte: end } };
      case "lt": return { created_at: { lt: start } };
      case "gte": return { created_at: { gte: start } };
      case "lte": return { created_at: { lt: end } };
    }
    return {};
  }

  if (filterCol === "last_contact") {
    if (!filterVal) return { id: { lt: 0 } };
    const start = new Date(filterVal + "T00:00:00");
    const end = new Date(start.getTime() + 86400000);
    switch (filterOp) {
      case "eq":
        return {
          AND: [
            { contacts: { some: { start_date: { gte: start, lt: end } } } },
            { contacts: { none: { start_date: { gte: end } } } },
          ],
        };
      case "gt":
        return { contacts: { some: { start_date: { gte: end } } } };
      case "lt":
        return {
          AND: [
            { contacts: { some: {} } },
            { contacts: { every: { start_date: { lt: start } } } },
          ],
        };
      case "gte":
        return { contacts: { some: { start_date: { gte: start } } } };
      case "lte":
        return {
          AND: [
            { contacts: { some: {} } },
            { contacts: { none: { start_date: { gte: end } } } },
          ],
        };
    }
    return {};
  }

  // Numeric columns — original JS: Number(null) = 0, so null fields act as 0
  const numVal = Number(filterVal);
  if (isNaN(numVal)) return {}; // invalid filterVal → match all

  const opMap: Record<string, object> = {
    eq: { equals: numVal },
    gt: { gt: numVal },
    lt: { lt: numVal },
    gte: { gte: numVal },
    lte: { lte: numVal },
  };
  const prismaOp = opMap[filterOp];
  if (!prismaOp) return {};

  const nullableIntCols = ["week_trans", "daily_trans", "monthly_trans"];
  const baseFilter = { [filterCol]: prismaOp };
  if (nullableIntCols.includes(filterCol) && zeroSatisfiesFilter(filterOp, numVal)) {
    return { OR: [baseFilter, { [filterCol]: null }] };
  }
  return baseFilter;
}

async function buildContactsCountWhere(filterOp: string, filterVal: string): Promise<Prisma.userSummaryWhereInput> {
  const numVal = Number(filterVal);
  if (isNaN(numVal)) return {}; // invalid filterVal → match all

  type Row = { user_id: string | null };
  let rows: Row[] = [];

  switch (filterOp) {
    case "eq":
      rows = await prisma.$queryRaw<Row[]>`
        SELECT user_id FROM "userSummary"
        WHERE (SELECT COUNT(*) FROM contacts WHERE contacts.user_id = "userSummary".user_id) = ${numVal}
      `;
      break;
    case "gt":
      rows = await prisma.$queryRaw<Row[]>`
        SELECT user_id FROM "userSummary"
        WHERE (SELECT COUNT(*) FROM contacts WHERE contacts.user_id = "userSummary".user_id) > ${numVal}
      `;
      break;
    case "lt":
      rows = await prisma.$queryRaw<Row[]>`
        SELECT user_id FROM "userSummary"
        WHERE (SELECT COUNT(*) FROM contacts WHERE contacts.user_id = "userSummary".user_id) < ${numVal}
      `;
      break;
    case "gte":
      rows = await prisma.$queryRaw<Row[]>`
        SELECT user_id FROM "userSummary"
        WHERE (SELECT COUNT(*) FROM contacts WHERE contacts.user_id = "userSummary".user_id) >= ${numVal}
      `;
      break;
    case "lte":
      rows = await prisma.$queryRaw<Row[]>`
        SELECT user_id FROM "userSummary"
        WHERE (SELECT COUNT(*) FROM contacts WHERE contacts.user_id = "userSummary".user_id) <= ${numVal}
      `;
      break;
    default:
      return {};
  }

  const nonNullIds = rows.map(r => r.user_id).filter((id): id is string => id !== null);
  const hasNullMatch = rows.some(r => r.user_id === null);

  if (hasNullMatch) {
    return { OR: [{ user_id: { in: nonNullIds } }, { user_id: null }] };
  }
  return { user_id: { in: nonNullIds } };
}

export async function getUsersFromNeon(options: GetUsersOptions = {}) {
  await assertAuthenticatedAdmin();

  if (!hasDatabaseUrl()) {
    console.warn("DATABASE_URL is not configured. Falling back to Supabase for reads.");
    return getUsersFromSupabase(options);
  }

  const { limit = 50, page = 1, search = "", sortBy = "created_at", sortDesc = true, filterCol, filterOp, filterVal } = options;
  const skip = (page - 1) * limit;
  const where = search
    ? {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { surname: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }
    : {};

  let orderBy: Prisma.userSummaryOrderByWithRelationInput;

  if (sortBy === "contacts") {
    orderBy = {
      contacts: {
        _count: sortDesc ? "desc" : "asc",
      },
    };
  } else {
    orderBy = {
      [sortBy]: sortDesc ? "desc" : "asc",
    };
  }

  try {
    let customFilterWhere: Prisma.userSummaryWhereInput = {};
    const isCustomFilterActive = Boolean(filterCol && filterOp && filterVal);

    if (isCustomFilterActive) {
      customFilterWhere = filterCol === "contacts"
        ? await buildContactsCountWhere(filterOp!, filterVal!)
        : buildFilterWhere(filterCol!, filterOp!, filterVal!);
    }

    const andClauses: Prisma.userSummaryWhereInput[] = [];
    if (Object.keys(where).length > 0) andClauses.push(where);
    if (Object.keys(customFilterWhere).length > 0) andClauses.push(customFilterWhere);
    const combinedWhere: Prisma.userSummaryWhereInput =
      andClauses.length === 2 ? { AND: andClauses } :
      andClauses.length === 1 ? andClauses[0] :
      {};

    const [users, totalCount] = await Promise.all([
      prisma.userSummary.findMany({
        include: {
          _count: {
            select: { contacts: true },
          },
          contacts: {
            orderBy: { start_date: "desc" },
            select: { start_date: true },
            take: 1,
          },
        },
        orderBy,
        skip,
        take: limit,
        where: combinedWhere,
      }),
      prisma.userSummary.count({ where: combinedWhere }),
    ]);

    return {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      users,
    };
  } catch (error) {
    console.error("Error al obtener usuarios de la base principal:", error);
    return { totalCount: 0, totalPages: 0, users: [] };
  }
}

export async function getUserProfile(userId: string) {
  await assertAuthenticatedAdmin();

  if (!hasDatabaseUrl()) {
    console.warn("DATABASE_URL is not configured. Falling back to Supabase for profile reads.");
    return getUserProfileFromSupabase(userId);
  }

  try {
    const user = await prisma.userSummary.findUnique({
      include: {
        contacts: {
          orderBy: { start_date: "desc" },
        },
      },
      where: { user_id: userId },
    });

    return user;
  } catch (error) {
    console.error("Error al obtener perfil del usuario:", error);
    return null;
  }
}

export async function getUserTransactionHistory(userId: string) {
  await assertAuthenticatedAdmin();
  const supabase = await createAuthenticatedSupabaseClient();

  // Extraemos las transacciones directamente desde la tabla apuntada para asegurar que no nos afecten
  // los limites de registros de Supabase en sub-consultas (embebed data limit).
  let userTransactions: any[] = [];
  let from = 0;
  const limit = 1000;
  let keepFetching = true;

  while (keepFetching) {
    const { data, error } = await supabase
      .from("transactions")
      .select("created_at")
      .eq("user_id", userId)
      .range(from, from + limit - 1);

    if (error || !data) {
      break;
    }

    if (data.length > 0) {
      userTransactions = userTransactions.concat(data);
      from += limit;
    } else {
      keepFetching = false;
    }
  }

  if (userTransactions.length === 0) {
    return [];
  }

  const dailyCounts: Record<string, number> = {};


  for (const tx of userTransactions) {
    if (!tx.created_at) continue;
    const txDate = new Date(tx.created_at);

    // NO ignoramos las transacciones de "hoy", ya que el panel global (cron/sync) 
    // las incluye en el contador semanal y mensual de forma integral.
    // Agrupamos bajo el día estricto UTC para consistencia:
    const txDay = new Date(Date.UTC(txDate.getUTCFullYear(), txDate.getUTCMonth(), txDate.getUTCDate()));
    const dateStr = txDay.toISOString().split("T")[0];
    dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
  }

  const timestamps = Object.keys(dailyCounts).map(d => new Date(d).getTime());
  const series = [];

  if (timestamps.length > 0) {
    const minTimestamp = Math.min(...timestamps);
    const startDay = new Date(minTimestamp);

    // Iteramos hasta "hoy" (UTC), para evitar que falten jornadas 
    // vacías en el final del gráfico.
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // O si hubo transacciones futuras accidentalmente grabadas, el máximo entre las registradas y hoy
    const maxTimestamp = Math.max(...timestamps, todayUTC.getTime());
    const endIter = new Date(maxTimestamp);

    for (let d = startDay; d.getTime() <= endIter.getTime(); d.setUTCDate(d.getUTCDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      series.push({
        date: dateStr,
        count: dailyCounts[dateStr] || 0,
      });
    }
  }

  return series;
}
