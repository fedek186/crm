"use server";

import { revalidatePath } from "next/cache";
import { createAuthenticatedSupabaseClient, assertAuthenticatedAdmin } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

type SupabaseUserRecord = {
  country: string | null;
  created_at: string | null;
  email: string | null;
  id: string | number;
  name: string | null;
  phone: string | number | null;
  surname: string | null;
  transactions: Array<{
    date: string | null;
    id: string | number;
  }> | null;
  user_integrations: Array<{
    id: string | number;
  }> | null;
};

export default async function getSupabaseData() {
  await assertAuthenticatedAdmin();

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
    throw new Error(`No se pudieron sincronizar usuarios desde Supabase: ${error.message}`);
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  const processedData = ((data as SupabaseUserRecord[] | null) ?? []).map((user) => {
    const hasMP = Boolean(user.user_integrations?.length);

    let daily_trans = 0;
    let week_trans = 0;
    let monthly_trans = 0;

    for (const transaction of user.transactions ?? []) {
      if (!transaction.date) {
        continue;
      }

      const transactionDate = new Date(transaction.date).getTime();

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
      country: user.country,
      created_at: user.created_at,
      daily_trans,
      email: user.email,
      id: user.id,
      monthly_trans,
      mp: hasMP,
      name: user.name,
      phone: user.phone,
      surname: user.surname,
      week_trans,
    };
  });

  const formattedPrismaData = processedData.map((user) => ({
    country: user.country,
    created_at: user.created_at ? new Date(user.created_at) : null,
    daily_trans: user.daily_trans,
    email: user.email,
    last_update: new Date(),
    monthly_trans: user.monthly_trans,
    mp: user.mp,
    name: user.name,
    phone: user.phone ? String(user.phone) : null,
    surname: user.surname,
    user_id: String(user.id),
    week_trans: user.week_trans,
  }));

  if (formattedPrismaData.length > 0) {
    const upsertPromises = formattedPrismaData.map((summary) =>
      prisma.userSummary.upsert({
        create: summary,
        update: summary,
        where: { user_id: summary.user_id },
      })
    );

    await Promise.all([
      ...upsertPromises,
      prisma.refreshRuns.create({
        data: {
          date: new Date(),
        },
      }),
    ]);
  }

  revalidatePath("/");
}
