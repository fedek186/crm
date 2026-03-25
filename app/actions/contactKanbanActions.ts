/*
Este archivo contiene las Server Actions específicas para la funcionalidad Kanban de contactos.
Expone funciones de escritura masiva (bulk update) que permiten modificar el estado y la posición 
de los contactos sincronizadamente usando Prisma transactions.

Elementos externos:
- assertAuthenticatedAdmin: valida seguridad antes de mutar la BD.
- prisma: cliente de conexión a la base de Postgres.
- revalidatePath: recarga optimista en Next.js.
- ContactState: Tipo global del enum de Prisma.

Funciones exportadas:
- updateContactsKanbanOrder: Recibe múltiples actualizaciones de contactos tras hacer drag & drop.
*/
"use server";

import { assertAuthenticatedAdmin } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { ContactState } from "@prisma/client";

export async function updateContactsKanbanOrder(updates: { id: number; state: ContactState; board_order: number }[]) {
  await assertAuthenticatedAdmin();

  try {
    // Usamos $transaction de Prisma para que todo falle o todo de éxito junto
    await prisma.$transaction(
      updates.map((update) =>
        prisma.contacts.update({
          where: { id: update.id },
          data: {
            state: update.state,
            board_order: update.board_order,
            end_date: update.state === 'finalizado' ? new Date() : null,
          },
        })
      )
    );

    revalidatePath("/contacts");
    return { success: true };
  } catch (error) {
    console.error("Error updating kanban order:", error);
    return { success: false, error: "No se pudo actualizar el orden en el kanban" };
  }
}
