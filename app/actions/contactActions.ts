"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";
import { ContactState, ContactObjective, media } from "@prisma/client";

export async function addContactAction(formData: FormData) {
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
