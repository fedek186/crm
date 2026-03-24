"use server";

import { revalidatePath } from "next/cache";
import type { Merchant } from "@/app/lib/merchant";
import {
  createMerchant,
  deleteMerchant,
  getMerchantErrorMessage,
  getMerchantById,
  getMerchants,
  MerchantMutationInput,
  MerchantUpdateInput,
  updateMerchant,
} from "@/app/services/merchant.service";

export type MerchantActionResult<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

export type MerchantFormPayload = {
  name: string;
  domain: string;
  logo_url: string;
  aliases: string;
};

function parseAliases(value: string): string[] {
  return value
    .split(",")
    .map((alias) => alias.trim())
    .filter((alias) => alias.length > 0);
}

function toMerchantMutationInput(payload: MerchantFormPayload): MerchantMutationInput {
  return {
    name: payload.name,
    domain: payload.domain || null,
    logo_url: payload.logo_url || null,
    aliases: parseAliases(payload.aliases),
  };
}

function toMerchantUpdateInput(payload: MerchantFormPayload): MerchantUpdateInput {
  return {
    name: payload.name,
    domain: payload.domain || null,
    logo_url: payload.logo_url || null,
    aliases: parseAliases(payload.aliases),
  };
}

export async function getMerchantsAction(): Promise<MerchantActionResult<Merchant[]>> {
  try {
    const result = await getMerchants();
    return { success: true, data: result.merchants, error: null };
  } catch (error) {
    console.error("Error getting merchants:", error);
    return {
      success: false,
      data: null,
      error: getMerchantErrorMessage(error, "No se pudieron obtener los merchants."),
    };
  }
}

export async function getMerchantByIdAction(
  id: Merchant["id"]
): Promise<MerchantActionResult<Merchant>> {
  try {
    const merchant = await getMerchantById(id);

    if (!merchant) {
      return {
        success: false,
        data: null,
        error: "Merchant no encontrado.",
      };
    }

    return { success: true, data: merchant, error: null };
  } catch (error) {
    console.error("Error getting merchant by id:", error);
    return {
      success: false,
      data: null,
      error: getMerchantErrorMessage(error, "No se pudo obtener el merchant."),
    };
  }
}

export async function createMerchantAction(
  payload: MerchantFormPayload
): Promise<MerchantActionResult<Merchant>> {
  try {
    const merchant = await createMerchant(toMerchantMutationInput(payload));
    revalidatePath("/merchants");
    return { success: true, data: merchant, error: null };
  } catch (error) {
    console.error("Error creating merchant:", error);
    return {
      success: false,
      data: null,
      error: getMerchantErrorMessage(error, "No se pudo crear el merchant."),
    };
  }
}

export async function updateMerchantAction(
  id: Merchant["id"],
  payload: MerchantFormPayload
): Promise<MerchantActionResult<Merchant>> {
  try {
    const merchant = await updateMerchant(id, toMerchantUpdateInput(payload));
    revalidatePath("/merchants");
    return { success: true, data: merchant, error: null };
  } catch (error) {
    console.error("Error updating merchant:", error);
    return {
      success: false,
      data: null,
      error: getMerchantErrorMessage(error, "No se pudo actualizar el merchant."),
    };
  }
}

export async function deleteMerchantAction(
  id: Merchant["id"]
): Promise<MerchantActionResult<{ id: Merchant["id"] }>> {
  try {
    await deleteMerchant(id);
    revalidatePath("/merchants");
    return { success: true, data: { id }, error: null };
  } catch (error) {
    console.error("Error deleting merchant:", error);
    return {
      success: false,
      data: null,
      error: getMerchantErrorMessage(error, "No se pudo archivar el merchant."),
    };
  }
}
