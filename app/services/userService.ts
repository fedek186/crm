import { prisma } from "@/app/lib/prisma";

export interface GetUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDesc?: boolean;
}

export async function getUsersFromNeon(options: GetUsersOptions = {}) {
  const {
    page = 1,
    limit = 50,
    search = "",
    sortBy = "created_at",
    sortDesc = true
  } = options;

  const skip = (page - 1) * limit;

  // Construir el filtro de búsqueda general
  const where = search ? {
    OR: [
      { name: { contains: search, mode: "insensitive" as const } },
      { surname: { contains: search, mode: "insensitive" as const } },
      { email: { contains: search, mode: "insensitive" as const } }
    ]
  } : {};

  // Construir el ordenamiento de forma dinámica
  let orderBy: any = {};
  if (sortBy) {
    if (sortBy === "contacts") {
      orderBy = {
        contacts: {
          _count: sortDesc ? "desc" : "asc"
        }
      };
    } else {
      orderBy = { [sortBy]: sortDesc ? "desc" : "asc" };
    }
  } else {
    orderBy = { created_at: "desc" };
  }

  try {
    const [users, totalCount] = await Promise.all([
      prisma.userSummary.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: { contacts: true }
          },
          // Traemos el contacto más reciente para obtener su última fecha
          contacts: {
            orderBy: { start_date: "desc" },
            take: 1,
            select: { start_date: true }
          }
        }
      }),
      prisma.userSummary.count({ where })
    ]);

    return {
      users,
      totalCount,
      totalPages: Math.ceil(totalCount / limit)
    };
  } catch (error) {
    console.error("Error al obtener usuarios de la base de Neon:", error);
    return { users: [], totalCount: 0, totalPages: 0 };
  }
}

export async function getUserProfile(userId: string) {
  try {
    const user = await prisma.userSummary.findUnique({
      where: { user_id: userId },
      include: {
        contacts: {
          orderBy: { start_date: "desc" },
          include: {
            notes: {
              orderBy: { date: "desc" }
            }
          }
        }
      }
    });
    return user;
  } catch (error) {
    console.error("Error al obtener perfil del usuario:", error);
    return null;
  }
}
