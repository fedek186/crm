export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export type TransactionSortOption =
  | "date-desc"
  | "date-asc"
  | "amount-desc"
  | "amount-asc";

export type TransactionFilterOption =
  | "all"
  | "transfers"
  | "without-merchant"
  | "balance-adjustments";

export type TransactionFiltersState = {
  filter: TransactionFilterOption;
  page: number;
  search: string;
  sort: TransactionSortOption;
};

export type TransactionListItem = {
  amount: number;
  category: {
    emoji: string | null;
    name: string | null;
  } | null;
  country: string | null;
  createdAt: string | null;
  date: string | null;
  description: string | null;
  externalRef: string | null;
  id: string;
  merchant: {
    domain: string | null;
    id: string;
    logoUrl: string | null;
    name: string | null;
  } | null;
  status: string | null;
  transactionKind: string | null;
  updatedAt: string | null;
  user: {
    email: string | null;
  } | null;
  rawData: JsonValue | null;
  walletId: string | null;
  wallet: {
    kind: string | null;
    name: string | null;
    provider: {
      icon: string | null;
      name: string | null;
    } | null;
  } | null;
};

export type TransactionDetail = TransactionListItem;

export type MerchantOption = {
  aliases: string[];
  domain: string | null;
  id: string;
  logoUrl: string | null;
  name: string;
};

export const TRANSACTION_KIND_TRANSFER = "TRANSFER";
export const TRANSACTION_KIND_BALANCE_ADJUSTMENT = "BALANCE_ADJUSTMENT";

export function isTransferTransaction(transactionKind: string | null): boolean {
  return transactionKind === TRANSACTION_KIND_TRANSFER;
}

export function isBalanceAdjustmentTransaction(transactionKind: string | null): boolean {
  return transactionKind === TRANSACTION_KIND_BALANCE_ADJUSTMENT;
}
