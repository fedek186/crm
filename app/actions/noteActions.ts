"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addNoteAction(formData: FormData) {
  const contactId = Number(formData.get("contactId"));
  const userId = formData.get("userId") as string;
  const title = formData.get("title") as string;
  const text = formData.get("text") as string;

  try {
    await prisma.notes.create({
      data: {
        contact_id: contactId,
        title,
        text,
      },
    });

    revalidatePath(`/profile/${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Error adding note:", error);
    return { success: false, error: "No se pudo añadir la nota" };
  }
}

export async function updateNoteAction(formData: FormData) {
  const noteId = Number(formData.get("noteId"));
  const userId = formData.get("userId") as string;
  const title = formData.get("title") as string;
  const text = formData.get("text") as string;

  try {
    await prisma.notes.update({
      where: { id: noteId },
      data: {
        title,
        text,
      },
    });

    revalidatePath(`/profile/${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating note:", error);
    return { success: false, error: "No se pudo actualizar la nota" };
  }
}
