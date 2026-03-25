/*
Este archivo contiene las mutaciones de servidor (Server Actions) para gestionar interacciones comerciales.
Se utiliza para realizar operaciones de escritura sobre la tabla de contactos y revalidar la caché de Next.js.

Elementos externos:
- assertAuthenticatedAdmin: valida seguridad básica antes de mutar la BD.
- prisma: cliente auto-generado para consultar la base Postgres.
- revalidatePath: purga la caché asíncrona de Next.js.

Funciones exportadas:
- addContactAction: inserta un nuevo contacto asociado a un usuario.
- updateContactStateAction: actualiza el estado (contactado, hablando, etc.) de la ficha individual.
- updateContactNotesAction: almacena el texto enriquecido de las notas del contacto.
- deleteContactAction: elimina físicamente el registro de la interacción de este usuario.
*/
"use server";

import { assertAuthenticatedAdmin } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { ContactState, ContactObjective, media } from "@prisma/client";

export async function addContactAction(formData: FormData) {
  await assertAuthenticatedAdmin();

  const userId = formData.get("userId") as string;
  const state = formData.get("state") as ContactState;
  const objective = formData.get("objective") as ContactObjective;
  const contactMedia = formData.get("media") as media;

  try {
    await prisma.contacts.create({
      data: {
        user_id: userId,
        state: state || "contacted",
        objective: objective || "activation",
        media: contactMedia || "email",
        start_date: new Date(),
      },
    });

    revalidatePath(`/profile/${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Error adding contact:", error);
    return { success: false, error: "No se pudo añadir el contacto" };
  }
}

export async function updateContactStateAction(contactId: number, newState: ContactState, userId: string) {
  await assertAuthenticatedAdmin();

  try {
    await prisma.contacts.update({
      where: { id: contactId },
      data: {
        state: newState,
        end_date: newState === 'finalizado' ? new Date() : null,
      },
    });

    revalidatePath(`/profile/${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating contact state:", error);
    return { success: false, error: "No se pudo actualizar el estado" };
  }
}

export async function updateContactNotesAction(contactId: number, notes: string | null, userId: string) {
  await assertAuthenticatedAdmin();

  try {
    await prisma.contacts.update({
      where: { id: contactId },
      data: { notes },
    });

    revalidatePath(`/profile/${userId}`);
    revalidatePath(`/contacts`);
    return { success: true };
  } catch (error) {
    console.error("Error updating contact notes:", error);
    return { success: false, error: "No se pudo guardar la nota" };
  }
}

export async function deleteContactAction(contactId: number, userId: string) {
  await assertAuthenticatedAdmin();

  try {
    await prisma.contacts.delete({
      where: { id: contactId },
    });

    revalidatePath(`/profile/${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting contact:", error);
    return { success: false, error: "No se pudo eliminar el contacto" };
  }
}
