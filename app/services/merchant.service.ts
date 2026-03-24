import { createAuthenticatedSupabaseClient } from "@/app/lib/auth";
import type { Merchant } from "@/app/lib/merchant";

export type MerchantMutationInput = Pick<
  Merchant,
  "name" | "domain" | "logo_url" | "aliases"
>;

export type MerchantUpdateInput = Partial<MerchantMutationInput>;

export interface GetMerchantsOptions {
  limit?: number;
  page?: number;
  search?: string;
}

export type GetMerchantsResult = {
  merchants: Merchant[];
  totalCount: number;
  totalPages: number;
};

export class MerchantConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MerchantConfigurationError";
  }
}

type MerchantRow = Merchant;

function toMerchant(row: unknown): Merchant {
  return row as MerchantRow;
}

function toMerchantList(rows: unknown[] | null): Merchant[] {
  return (rows ?? []).map((row) => toMerchant(row));
}

function normalizeOptionalField(value: string | null): string | null {
  const normalizedValue = value?.trim() ?? "";
  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeAliases(aliases: string[]): string[] {
  return Array.from(
    new Set(
      aliases
        .map((alias) => alias.trim())
        .filter((alias) => alias.length > 0)
    )
  );
}

function normalizeMerchantInput(input: MerchantMutationInput): MerchantMutationInput {
  const normalizedName = input.name.trim();

  if (normalizedName.length === 0) {
    throw new Error("El nombre del merchant es obligatorio.");
  }

  return {
    aliases: normalizeAliases(input.aliases),
    domain: normalizeOptionalField(input.domain),
    logo_url: normalizeOptionalField(input.logo_url),
    name: normalizedName,
  };
}

function normalizeMerchantUpdateInput(input: MerchantUpdateInput): MerchantUpdateInput {
  const normalizedInput: MerchantUpdateInput = {};

  if (typeof input.name === "string") {
    const normalizedName = input.name.trim();

    if (normalizedName.length === 0) {
      throw new Error("El nombre del merchant es obligatorio.");
    }

    normalizedInput.name = normalizedName;
  }

  if (input.domain !== undefined) {
    normalizedInput.domain = normalizeOptionalField(input.domain);
  }

  if (input.logo_url !== undefined) {
    normalizedInput.logo_url = normalizeOptionalField(input.logo_url);
  }

  if (input.aliases !== undefined) {
    normalizedInput.aliases = normalizeAliases(input.aliases);
  }

  return normalizedInput;
}

function getSelectFields(): string {
  return "id, name, domain, logo_url, aliases, created_at, updated_at, deleted_at";
}

function isMissingDeletedAtColumn(errorMessage: string): boolean {
  return errorMessage.toLowerCase().includes("deleted_at");
}

function normalizeSearchTerm(value: string | undefined): string {
  return value?.trim() ?? "";
}

function escapeForLikeOperator(value: string): string {
  return value.replace(/[%_]/g, (character) => `\\${character}`);
}

function escapeForArrayOperator(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function listMerchants(
  includeArchived: boolean,
  options: GetMerchantsOptions = {}
): Promise<GetMerchantsResult> {
  const { limit = 12, page = 1, search } = options;
  const safePage = Math.max(page, 1);
  const from = (safePage - 1) * limit;
  const to = from + limit - 1;
  const normalizedSearch = normalizeSearchTerm(search);
  const supabase = await createAuthenticatedSupabaseClient();
  let query = supabase
    .from("merchants")
    .select(getSelectFields(), { count: "exact" })
    .order("created_at", { ascending: false })
    .order("name", { ascending: true })
    .range(from, to);

  if (!includeArchived) {
    query = query.is("deleted_at", null);
  }

  if (normalizedSearch) {
    const escapedSearch = escapeForLikeOperator(normalizedSearch);
    const escapedAlias = escapeForArrayOperator(normalizedSearch);

    query = query.or(
      [
        `name.ilike.%${escapedSearch}%`,
        `domain.ilike.%${escapedSearch}%`,
        `aliases.cs.{"${escapedAlias}"}`,
      ].join(",")
    );
  }

  const { count, data, error } = await query;

  if (error) {
    if (!includeArchived && isMissingDeletedAtColumn(error.message)) {
      return listMerchants(true, options);
    }

    throw new MerchantConfigurationError(error.message);
  }

  const totalCount = count ?? 0;

  return {
    merchants: toMerchantList(data as unknown[] | null),
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / limit)),
  };
}

async function getMerchantByIdInternal(id: Merchant["id"], includeArchived: boolean) {
  const supabase = await createAuthenticatedSupabaseClient();
  let query = supabase
    .from("merchants")
    .select(getSelectFields())
    .eq("id", id)
    .limit(1);

  if (!includeArchived) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;

  if (error) {
    if (!includeArchived && isMissingDeletedAtColumn(error.message)) {
      return getMerchantByIdInternal(id, true);
    }

    throw new MerchantConfigurationError(error.message);
  }

  const merchants = toMerchantList(data as unknown[] | null);
  return merchants[0] ?? null;
}

async function getActiveMerchantOrThrow(id: Merchant["id"]): Promise<Merchant> {
  const merchant = await getMerchantById(id);

  if (!merchant) {
    throw new Error("Merchant no encontrado.");
  }

  return merchant;
}

export async function getMerchants(
  options: GetMerchantsOptions = {}
): Promise<GetMerchantsResult> {
  return listMerchants(false, options);
}

export async function getMerchantById(id: Merchant["id"]): Promise<Merchant | null> {
  return getMerchantByIdInternal(id, false);
}

export async function createMerchant(input: MerchantMutationInput): Promise<Merchant> {
  const supabase = await createAuthenticatedSupabaseClient();
  const normalizedInput = normalizeMerchantInput(input);
  const { data, error } = await supabase
    .from("merchants")
    .insert({
      ...normalizedInput,
      deleted_at: null,
    })
    .select(getSelectFields())
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toMerchant(data);
}

export async function updateMerchant(
  id: Merchant["id"],
  input: MerchantUpdateInput
): Promise<Merchant> {
  await getActiveMerchantOrThrow(id);

  const supabase = await createAuthenticatedSupabaseClient();
  const normalizedInput = normalizeMerchantUpdateInput(input);
  const { data, error } = await supabase
    .from("merchants")
    .update(normalizedInput)
    .eq("id", id)
    .select(getSelectFields())
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toMerchant(data);
}

export async function deleteMerchant(id: Merchant["id"]): Promise<Merchant> {
  await getActiveMerchantOrThrow(id);

  const supabase = await createAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("merchants")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(getSelectFields())
    .single();

  if (error) {
    if (isMissingDeletedAtColumn(error.message)) {
      throw new MerchantConfigurationError(
        "La tabla merchants de Supabase todavia no tiene la columna deleted_at para soft delete."
      );
    }

    throw new Error(error.message);
  }

  return toMerchant(data);
}

export function getMerchantErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (error instanceof MerchantConfigurationError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}
