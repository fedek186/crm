import { createAuthenticatedSupabaseClient } from "@/app/lib/auth";
import {
  type JsonValue,
  type MerchantOption,
  type TransactionDetail,
  type TransactionFiltersState,
  type TransactionListItem,
  TRANSACTION_KIND_BALANCE_ADJUSTMENT,
  TRANSACTION_KIND_TRANSFER,
} from "@/app/lib/transaction";

const DEFAULT_TRANSACTION_LIMIT = 25;
const RELATED_SEARCH_LIMIT = 75;
const MERCHANT_OPTIONS_LIMIT = 50;

type GetTransactionsOptions = Partial<TransactionFiltersState> & {
  limit?: number;
};

export type GetTransactionsResult = {
  items: TransactionListItem[];
  page: number;
  totalCount: number;
  totalPages: number;
};

type TransactionCategoryRow = {
  emoji: string | null;
  name: string | null;
} | null;

type TransactionMerchantRow = {
  domain: string | null;
  id: string;
  logo_url: string | null;
  name: string | null;
} | null;

type TransactionUserRow = {
  email: string | null;
} | null;

type TransactionWalletProviderRow = {
  icon: string | null;
  name: string | null;
} | null;

type TransactionWalletRow = {
  kind: string | null;
  name: string | null;
  providers: TransactionWalletProviderRow;
} | null;

type TransactionRow = {
  amount: number | string | null;
  categories: TransactionCategoryRow;
  country: string | null;
  created_at: string | null;
  date: string | null;
  description: string | null;
  external_ref: string | null;
  id: string;
  merchants: TransactionMerchantRow;
  raw_data: JsonValue | null;
  status: string | null;
  transaction_kind: string | null;
  updated_at: string | null;
  users: TransactionUserRow;
  wallet_id: string | null;
  wallets: TransactionWalletRow;
};

type MerchantSearchRow = {
  aliases: string[] | null;
  domain: string | null;
  id: string;
  logo_url: string | null;
  name: string;
};

type SearchIdsResult = {
  merchantIds: string[];
  userIds: string[];
};

type IdentifierRow = {
  id: string;
};

function getTransactionsSelect(): string {
  return `
    id,
    amount,
    description,
    date,
    created_at,
    updated_at,
    country,
    status,
    external_ref,
    raw_data,
    transaction_kind,
    wallet_id,
    users(email),
    merchants(id, name, logo_url, domain),
    categories(name, emoji),
    wallets(name, kind, providers(name, icon))
  `;
}

function normalizeSearchTerm(value: string | undefined): string {
  return value?.trim() ?? "";
}

function sanitizeLikeTerm(value: string): string {
  return value.replace(/[,*()]/g, " ").trim();
}

function normalizeAmount(value: number | string | null): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = Number(value);
    return Number.isNaN(parsedValue) ? 0 : parsedValue;
  }

  return 0;
}

function toTransactionListItem(row: TransactionRow): TransactionListItem {
  return {
    amount: normalizeAmount(row.amount),
    category: row.categories
      ? {
          emoji: row.categories.emoji,
          name: row.categories.name,
        }
      : null,
    country: row.country,
    createdAt: row.created_at,
    date: row.date,
    description: row.description,
    externalRef: row.external_ref,
    id: row.id,
    rawData: row.raw_data,
    merchant: row.merchants
      ? {
          domain: row.merchants.domain,
          id: row.merchants.id,
          logoUrl: row.merchants.logo_url,
          name: row.merchants.name,
        }
      : null,
    status: row.status,
    transactionKind: row.transaction_kind,
    updatedAt: row.updated_at,
    user: row.users
      ? {
          email: row.users.email,
        }
      : null,
    walletId: row.wallet_id,
    wallet: row.wallets
      ? {
          kind: row.wallets.kind,
          name: row.wallets.name,
          provider: row.wallets.providers
            ? {
                icon: row.wallets.providers.icon,
                name: row.wallets.providers.name,
              }
            : null,
        }
      : null,
  };
}

function toTransactionList(rows: TransactionRow[] | null): TransactionListItem[] {
  return (rows ?? []).map((row) => toTransactionListItem(row));
}

function escapeInValues(values: string[]): string {
  return values.join(",");
}

function getSafePage(page?: number): number {
  if (!page || Number.isNaN(page)) {
    return 1;
  }

  return Math.max(1, page);
}

function getSafeLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_TRANSACTION_LIMIT;
  }

  return Math.max(1, Math.min(limit, 100));
}

async function getMatchingUserIds(search: string): Promise<string[]> {
  const safeSearch = sanitizeLikeTerm(search);

  if (!safeSearch) {
    return [];
  }

  const supabase = await createAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .ilike("email", `%${safeSearch}%`)
    .limit(RELATED_SEARCH_LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as IdentifierRow[])
    .map((row) => {
      const value = row.id;
      return typeof value === "string" ? value : null;
    })
    .filter((value): value is string => value !== null);
}

async function getMatchingMerchantIds(search: string): Promise<string[]> {
  const safeSearch = sanitizeLikeTerm(search);

  if (!safeSearch) {
    return [];
  }

  const supabase = await createAuthenticatedSupabaseClient();
  const [namedMerchantsResult, exactAliasResult] = await Promise.all([
    supabase
      .from("merchants")
      .select("id")
      .is("deleted_at", null)
      .or(`name.ilike.*${safeSearch}*,domain.ilike.*${safeSearch}*`)
      .limit(RELATED_SEARCH_LIMIT),
    supabase
      .from("merchants")
      .select("id")
      .is("deleted_at", null)
      .contains("aliases", [safeSearch])
      .limit(RELATED_SEARCH_LIMIT),
  ]);

  if (namedMerchantsResult.error) {
    throw new Error(namedMerchantsResult.error.message);
  }

  if (exactAliasResult.error) {
    throw new Error(exactAliasResult.error.message);
  }

  const merchantIds = new Set<string>();

  for (const row of (namedMerchantsResult.data ?? []) as unknown as IdentifierRow[]) {
    if (typeof row.id === "string") {
      merchantIds.add(row.id);
    }
  }

  for (const row of (exactAliasResult.data ?? []) as unknown as IdentifierRow[]) {
    if (typeof row.id === "string") {
      merchantIds.add(row.id);
    }
  }

  return Array.from(merchantIds);
}

async function resolveSearchIds(search: string): Promise<SearchIdsResult> {
  const normalizedSearch = normalizeSearchTerm(search);

  if (!normalizedSearch) {
    return {
      merchantIds: [],
      userIds: [],
    };
  }

  const [userIds, merchantIds] = await Promise.all([
    getMatchingUserIds(normalizedSearch),
    getMatchingMerchantIds(normalizedSearch),
  ]);

  return {
    merchantIds,
    userIds,
  };
}

function buildSearchConditions(search: string, ids: SearchIdsResult): string | null {
  const safeSearch = sanitizeLikeTerm(search);

  if (!safeSearch) {
    return null;
  }

  const conditions = [`description.ilike.*${safeSearch}*`];

  if (ids.userIds.length > 0) {
    conditions.push(`user_id.in.(${escapeInValues(ids.userIds)})`);
  }

  if (ids.merchantIds.length > 0) {
    conditions.push(`merchant_id.in.(${escapeInValues(ids.merchantIds)})`);
  }

  return conditions.join(",");
}

export async function getTransactions(
  options: GetTransactionsOptions = {}
): Promise<GetTransactionsResult> {
  const filter = options.filter ?? "all";
  const limit = getSafeLimit(options.limit);
  const page = getSafePage(options.page);
  const search = normalizeSearchTerm(options.search);
  const sort = options.sort ?? "date-desc";
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const supabase = await createAuthenticatedSupabaseClient();
  const searchIds = await resolveSearchIds(search);
  const searchConditions = buildSearchConditions(search, searchIds);

  let query = supabase
    .from("transactions")
    .select(getTransactionsSelect(), { count: "exact" })
    .is("deleted_at", null)
    .range(from, to);

  switch (filter) {
    case "transfers":
      query = query.eq("transaction_kind", TRANSACTION_KIND_TRANSFER);
      break;
    case "without-merchant":
      query = query.is("merchant_id", null);
      break;
    case "balance-adjustments":
      query = query.eq("transaction_kind", TRANSACTION_KIND_BALANCE_ADJUSTMENT);
      break;
    case "all":
    default:
      break;
  }

  switch (sort) {
    case "date-asc":
      query = query.order("date", { ascending: true }).order("created_at", { ascending: true });
      break;
    case "amount-desc":
      query = query.order("amount", { ascending: false }).order("date", { ascending: false });
      break;
    case "amount-asc":
      query = query.order("amount", { ascending: true }).order("date", { ascending: false });
      break;
    case "date-desc":
    default:
      query = query.order("date", { ascending: false }).order("created_at", { ascending: false });
      break;
  }

  if (searchConditions) {
    query = query.or(searchConditions);
  }

  const { count, data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const totalCount = count ?? 0;

  return {
    items: toTransactionList((data ?? null) as unknown as TransactionRow[] | null),
    page,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / limit)),
  };
}

export async function getTransactionById(
  transactionId: string
): Promise<TransactionDetail | null> {
  const supabase = await createAuthenticatedSupabaseClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(getTransactionsSelect())
    .eq("id", transactionId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const transaction = data ? toTransactionList([data as unknown as TransactionRow])[0] ?? null : null;

  return transaction;
}

export async function getMerchantOptions(options?: {
  limit?: number;
  search?: string;
}): Promise<MerchantOption[]> {
  const limit = Math.max(1, Math.min(options?.limit ?? MERCHANT_OPTIONS_LIMIT, 100));
  const search = normalizeSearchTerm(options?.search);
  const supabase = await createAuthenticatedSupabaseClient();

  if (!search) {
    const { data, error } = await supabase
      .from("merchants")
      .select("id,name,domain,logo_url,aliases")
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as MerchantSearchRow[]).map((merchant) => ({
      aliases: merchant.aliases ?? [],
      domain: merchant.domain,
      id: merchant.id,
      logoUrl: merchant.logo_url,
      name: merchant.name,
    }));
  }

  const safeSearch = sanitizeLikeTerm(search).toLowerCase();

  const [nameDomainResult, aliasResult] = await Promise.all([
    supabase
      .from("merchants")
      .select("id,name,domain,logo_url,aliases")
      .is("deleted_at", null)
      .or(`name.ilike.*${safeSearch}*,domain.ilike.*${safeSearch}*`)
      .limit(limit),
    supabase
      .from("merchants")
      .select("id,name,domain,logo_url,aliases")
      .is("deleted_at", null)
      .contains("aliases", [search])
      .limit(limit),
  ]);

  if (nameDomainResult.error) {
    throw new Error(nameDomainResult.error.message);
  }

  if (aliasResult.error) {
    throw new Error(aliasResult.error.message);
  }

  const merchantsById = new Map<string, MerchantOption>();

  for (const merchant of (nameDomainResult.data ?? []) as MerchantSearchRow[]) {
    merchantsById.set(merchant.id, {
      aliases: merchant.aliases ?? [],
      domain: merchant.domain,
      id: merchant.id,
      logoUrl: merchant.logo_url,
      name: merchant.name,
    });
  }

  for (const merchant of (aliasResult.data ?? []) as MerchantSearchRow[]) {
    merchantsById.set(merchant.id, {
      aliases: merchant.aliases ?? [],
      domain: merchant.domain,
      id: merchant.id,
      logoUrl: merchant.logo_url,
      name: merchant.name,
    });
  }

  return Array.from(merchantsById.values())
    .filter((merchant) => {
      const haystack = [merchant.name, merchant.domain ?? "", merchant.aliases.join(" ")]
        .join(" ")
        .toLowerCase();

      return haystack.includes(safeSearch);
    })
    .sort((left, right) => left.name.localeCompare(right.name))
    .slice(0, limit);
}

export async function assignMerchant(
  transactionId: string,
  merchantId: string
): Promise<void> {
  const supabase = await createAuthenticatedSupabaseClient();
  const { error } = await supabase
    .from("transactions")
    .update({
      merchant_id: merchantId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transactionId);

  if (error) {
    throw new Error(error.message);
  }
}
