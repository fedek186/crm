"use server";

import { revalidatePath } from "next/cache";
import type { MerchantOption } from "@/app/lib/transaction";
import { assignMerchant, getMerchantOptions } from "@/app/services/transaction.service";

export type TransactionActionResult = {
  error: string | null;
  success: boolean;
};

function normalizeIdentifier(value: string): string {
  return value.trim();
}

export async function assignMerchantToTransaction(
  transactionId: string,
  merchantId: string
): Promise<TransactionActionResult> {
  const normalizedTransactionId = normalizeIdentifier(transactionId);
  const normalizedMerchantId = normalizeIdentifier(merchantId);

  if (!normalizedTransactionId) {
    return {
      error: "La transaccion es obligatoria.",
      success: false,
    };
  }

  if (!normalizedMerchantId) {
    return {
      error: "El merchant es obligatorio.",
      success: false,
    };
  }

  try {
    await assignMerchant(normalizedTransactionId, normalizedMerchantId);
    revalidatePath("/transactions");

    return {
      error: null,
      success: true,
    };
  } catch (error) {
    console.error("Error assigning merchant to transaction:", error);

    return {
      error: error instanceof Error ? error.message : "No se pudo asignar el merchant.",
      success: false,
    };
  }
}

export async function getMerchantOptionsAction(search: string): Promise<MerchantOption[]> {
  try {
    return await getMerchantOptions({
      limit: 50,
      search,
    });
  } catch (error) {
    console.error("Error fetching merchant options:", error);
    return [];
  }
}
