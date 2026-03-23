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
  };
}

export interface GetUsersOptions {
  limit?: number;
  page?: number;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
}

export async function getUsersFromNeon(options: GetUsersOptions = {}) {
  await assertAuthenticatedAdmin();

  if (!hasDatabaseUrl()) {
    console.warn("DATABASE_URL is not configured. Falling back to Supabase for reads.");
    return getUsersFromSupabase(options);
  }

  const { limit = 50, page = 1, search = "", sortBy = "created_at", sortDesc = true } = options;
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
        where,
      }),
      prisma.userSummary.count({ where }),
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
          include: {
            notes: {
              orderBy: { date: "desc" },
            },
          },
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
