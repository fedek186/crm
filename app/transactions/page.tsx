import Pagination from "@/app/components/Pagination";
import TransactionFilters from "@/app/components/transactions/TransactionFilters";
import TransactionTable from "@/app/components/transactions/TransactionTable";
import PageShell from "@/app/components/ui/PageShell";
import PageHeader from "@/app/components/ui/PageHeader";
import PageError from "@/app/components/ui/PageError";
import { requireAuthenticatedAdminPage } from "@/app/lib/auth";
import type {
  TransactionFilterOption,
  TransactionListItem,
  TransactionSortOption,
} from "@/app/lib/transaction";
import { getTransactions } from "@/app/services/transaction.service";

type TransactionsPageProps = {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
};

function normalizeSort(value: string | undefined): TransactionSortOption {
  switch (value) {
    case "date-asc":
    case "amount-desc":
    case "amount-asc":
      return value;
    case "date-desc":
    default:
      return "date-desc";
  }
}

function normalizeFilter(value: string | undefined): TransactionFilterOption {
  switch (value) {
    case "transfers":
    case "without-merchant":
    case "balance-adjustments":
      return value;
    case "all":
    default:
      return "all";
  }
}

function normalizePage(value: string | undefined): number {
  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue) || parsedValue < 1) {
    return 1;
  }

  return parsedValue;
}

export default async function TransactionsPage(props: TransactionsPageProps) {
  await requireAuthenticatedAdminPage();

  const searchParams = (await props.searchParams) || {};
  const filter = normalizeFilter(searchParams.filter);
  const page = normalizePage(searchParams.page);
  const search = searchParams.search ?? "";
  const sort = normalizeSort(searchParams.sort);
  let loadError: string | null = null;
  let totalPages = 1;
  let items: TransactionListItem[] = [];

  try {
    const result = await getTransactions({
      filter,
      limit: 25,
      page,
      search,
      sort,
    });
    items = result.items;
    totalPages = result.totalPages;
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "No pudimos cargar las transacciones en este momento.";
  }

  return (
    <PageShell>
      <PageHeader
        title="Transacciones"
        subtitle="Explorá movimientos, detectá transferencias y asigná merchants sin salir del CRM."
      />
      {loadError ? (
        <PageError title="No se pudo cargar el módulo de transacciones" message={loadError} />
      ) : (
        <div className="space-y-6">
          <TransactionFilters />
          <TransactionTable transactions={items} />
          <Pagination totalPages={totalPages} />
        </div>
      )}
    </PageShell>
  );
}
