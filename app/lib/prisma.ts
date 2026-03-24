/*
Este archivo es un cliente de Prisma para conectarse a la base de datos de PiggyWarehouse.

Elementos externos:
- PrismaClient: cliente de Prisma.
- PrismaPg: adaptador de Prisma para PostgreSQL.
- Pool: pool de conexiones a PostgreSQL.

Funciones exportadas:
- createPrismaClient: crea un cliente de Prisma.
*/

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool, { schema: "PiggyWareHouse" });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}