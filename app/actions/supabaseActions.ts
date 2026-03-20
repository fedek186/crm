"use server";

import { revalidatePath } from "next/cache";

import { supabase } from '../lib/supabase';
import { prisma } from '../lib/prisma';

export default async function getSupabaseData() {
    const { data, error } = await supabase.from('users').select(`
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
        throw error;
    }

    // Definimos las fechas límite (se calcula una sola vez para ser eficiente)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = now.getTime() - (30 * 24 * 60 * 60 * 1000);

    // Transformamos los datos
    const processedData = data?.map((user: any) => {
        const hasMP = user.user_integrations && user.user_integrations.length > 0;
        
        let daily_trans = 0;
        let week_trans = 0;
        let monthly_trans = 0;

        // Calculamos las métricas iterando sus transacciones
        if (user.transactions && Array.isArray(user.transactions)) {
            for (const tx of user.transactions) {
                if (!tx.date) continue;
                const txDate = new Date(tx.date).getTime();
                
                // Hoy (desde la medianoche actual)
                if (txDate >= startOfToday) daily_trans++;
                // Últimos 7 días
                if (txDate >= sevenDaysAgo) week_trans++;
                // Últimos 30 días
                if (txDate >= thirtyDaysAgo) monthly_trans++;
            }
        }
        
        // Destructuramos para dejar afuera TANTO las integraciones como las transacciones
        const { user_integrations, transactions, ...restOfUser } = user;
        
        return {
            ...restOfUser,
            mp: hasMP,
            daily_trans,
            week_trans,
            monthly_trans
        };
    });


    const formattedPrismaData = processedData?.map((data) => ({
        user_id: String(data.id), // nos aseguramos de que siempre sea texto para el id
        email: data.email,
        name: data.name,
        surname: data.surname,
        phone: data.phone ? String(data.phone) : null,
        country: data.country,
        created_at: data.created_at ? new Date(data.created_at) : null,
        mp: data.mp,
        daily_trans: data.daily_trans,
        week_trans: data.week_trans,
        monthly_trans: data.monthly_trans,
        last_update: new Date()
    }));

    // Insertamos/Actualizamos en masa en NEON DB vía Prisma
    if (formattedPrismaData && formattedPrismaData.length > 0) {

        const upsertPromises = formattedPrismaData.map((summary) => 
            prisma.userSummary.upsert({
                where: { user_id: summary.user_id },
                update: summary,
                create: summary
            })
        );
        
        await Promise.all([
            ...upsertPromises,
            prisma.refreshRuns.create({
                data: {
                    date: new Date()
                }
            })
        ]);
        console.log(`¡Éxito! ${formattedPrismaData.length} registros guardados en la tabla de resúmenes Neon.`);
    } else {
        console.log("No se encontraron usuarios para insertar.");
    }
    
    // Al finalizar todo el proceso, pedimos a Next.js que revalide (refresque) la página principal
    revalidatePath("/");
}