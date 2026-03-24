"use client";

import { useState } from "react";
import Link from "next/link";
import AssignMerchantModal from "@/app/components/transactions/AssignMerchantModal";
import TransactionDetailModal from "@/app/components/transactions/TransactionDetailModal";
import {
  isBalanceAdjustmentTransaction,
  isTransferTransaction,
  type TransactionDetail,
} from "@/app/lib/transaction";

type TransactionTableProps = {
  transactions: TransactionDetail[];
};

const tableDateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
  year: "numeric",
});

const HIDDEN_AMOUNT_LABEL = "***";

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return tableDateFormatter.format(new Date(value));
}

function renderSignedAmount(amount: number) {
  const isPositive = amount > 0;
  const isNegative = amount < 0;
  const prefix = isPositive ? "+" : isNegative ? "-" : "";
  const colorClassName = isPositive ? "text-emerald-400" : "text-white";

  return (
    <span className={`font-bold tracking-[0.24em] ${colorClassName}`}>
      {`${prefix}${HIDDEN_AMOUNT_LABEL}`}
    </span>
  );
}

function renderMerchantAvatar(transaction: TransactionDetail) {
  if (transaction.merchant?.logoUrl) {
    return (
      <img
        alt={`Logo de ${transaction.merchant.name ?? "merchant"}`}
        className="h-10 w-10 rounded-xl border border-lux-hover/30 bg-white object-contain p-2"
        src={transaction.merchant.logoUrl}
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-lux-gold/40 bg-lux-bg text-lux-gold">
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M3 9.5 12 4l9 5.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10.5V19h14v-8.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 19v-5h6v5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function renderMerchantTrigger(
  transaction: TransactionDetail,
  onAssign: (transaction: TransactionDetail) => void
) {
  const merchantName = transaction.merchant?.name ?? "Merchant";
  const href = transaction.merchant
    ? `/merchants?search=${encodeURIComponent(transaction.merchant.name ?? "")}`
    : null;

  if (href) {
    return (
      <Link
        aria-label={`Abrir merchant ${merchantName}`}
        className="inline-flex rounded-2xl transition-transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-lux-gold/50"
        href={href}
        title={merchantName}
      >
        {renderMerchantAvatar(transaction)}
      </Link>
    );
  }

  return (
    <button
      aria-label="Asignar merchant"
      className="inline-flex rounded-2xl transition-transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-lux-gold/50"
      onClick={() => onAssign(transaction)}
      title="Asignar merchant"
      type="button"
    >
      {renderMerchantAvatar(transaction)}
    </button>
  );
}

function renderWalletKindIcon(kind: string | null) {
  const baseClassName =
    "flex h-10 w-10 items-center justify-center rounded-xl border border-lux-hover/30 bg-lux-bg text-lux-sec";

  switch (kind) {
    case "CREDIT_CARD":
      return (
        <div className={baseClassName}>
          <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <rect height="14" rx="2.5" width="18" x="3" y="5" />
            <path d="M3 10h18" strokeLinecap="round" />
          </svg>
        </div>
      );
    case "BANK":
      return (
        <div className={baseClassName}>
          <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M3 9.5 12 4l9 5.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 20h14" strokeLinecap="round" />
            <path d="M7 10.5V18" strokeLinecap="round" />
            <path d="M12 10.5V18" strokeLinecap="round" />
            <path d="M17 10.5V18" strokeLinecap="round" />
          </svg>
        </div>
      );
    case "BROKER":
      return (
        <div className={baseClassName}>
          <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M5 16 9 12l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 20h14" strokeLinecap="round" />
          </svg>
        </div>
      );
    case "CASH":
      return (
        <div className={baseClassName}>
          <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <rect height="12" rx="2.5" width="18" x="3" y="6" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
        </div>
      );
    case "OTHER":
    case "WALLET":
    default:
      return (
        <div className={baseClassName}>
          <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H18a2 2 0 0 1 2 2v1H6.5A2.5 2.5 0 0 0 4 11.5v0" strokeLinecap="round" />
            <path d="M4 11.5A2.5 2.5 0 0 1 6.5 9H20v7a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 15.5v-4Z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="16.5" cy="13.5" r="0.75" fill="currentColor" stroke="none" />
          </svg>
        </div>
      );
  }
}

function renderWalletAvatar(transaction: TransactionDetail) {
  if (transaction.wallet?.provider?.icon) {
    return (
      <img
        alt={`Logo de ${transaction.wallet.provider.name ?? transaction.wallet.name ?? "wallet"}`}
        className="h-10 w-10 rounded-xl border border-lux-hover/30 bg-white object-contain p-2"
        src={transaction.wallet.provider.icon}
      />
    );
  }

  return renderWalletKindIcon(transaction.wallet?.kind ?? null);
}

function renderWalletLabel(transaction: TransactionDetail): string {
  if (!transaction.wallet && transaction.walletId) {
    return "Wallet sin acceso";
  }

  return (
    transaction.wallet?.provider?.name ??
    transaction.wallet?.name ??
    transaction.wallet?.kind ??
    "Sin wallet"
  );
}

function renderCategory(transaction: TransactionDetail) {
  if (!transaction.category) {
    return <span className="text-sm text-lux-muted">Sin categoría</span>;
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-lux-hover/40 bg-lux-bg px-3 py-1 text-xs font-semibold text-white">
      <span>{transaction.category.emoji ?? "•"}</span>
      <span>{transaction.category.name ?? "Sin nombre"}</span>
    </span>
  );
}

function renderKindBadges(transaction: TransactionDetail) {
  const badges: React.ReactNode[] = [];

  if (isTransferTransaction(transaction.transactionKind)) {
    badges.push(
      <span
        className="rounded-full border border-sky-400/40 bg-sky-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-200"
        key="transfer"
      >
        Transferencia
      </span>
    );
  }

  if (isBalanceAdjustmentTransaction(transaction.transactionKind)) {
    badges.push(
      <span
        className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200"
        key="balance-adjustment"
      >
        Ajuste balance
      </span>
    );
  }

  if (badges.length === 0) {
    badges.push(
      <span
        className="rounded-full border border-lux-hover/40 bg-lux-bg px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-lux-sec"
        key="normal"
      >
        {transaction.transactionKind ?? "Normal"}
      </span>
    );
  }

  return <div className="flex flex-wrap gap-2">{badges}</div>;
}

export default function TransactionTable({ transactions }: TransactionTableProps) {
  const [detailTransaction, setDetailTransaction] = useState<TransactionDetail | null>(null);
  const [merchantAssignmentTarget, setMerchantAssignmentTarget] = useState<TransactionDetail | null>(null);

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-lux-hover/40 bg-lux-surface px-6 py-14 text-center text-lux-sec shadow-xl">
        No encontramos transacciones con los filtros actuales.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 lg:hidden">
        {transactions.map((transaction) => (
          <article
            className="rounded-2xl border border-lux-hover/40 bg-lux-surface p-5 shadow-xl"
            key={transaction.id}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  {renderMerchantTrigger(transaction, setMerchantAssignmentTarget)}
                  <div
                    className="inline-flex rounded-2xl"
                    title={renderWalletLabel(transaction)}
                  >
                    {renderWalletAvatar(transaction)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                      {transaction.user?.email ?? "Sin usuario"}
                    </p>
                    <p className="mt-1 truncate text-xs text-lux-sec">{renderWalletLabel(transaction)}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-white">{transaction.description ?? "Sin descripción"}</p>
              </div>

              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.22em] text-lux-sec">Monto</p>
                <div className="mt-1 text-lg">{renderSignedAmount(transaction.amount)}</div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {renderCategory(transaction)}
              {renderKindBadges(transaction)}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-lux-hover/30 pt-4">
              <p className="text-xs text-lux-sec">{formatDate(transaction.date)}</p>
              <button
                className="btn btn-sm border-lux-hover bg-lux-bg text-white hover:border-lux-gold/50 hover:text-lux-gold"
                onClick={() => setDetailTransaction(transaction)}
                type="button"
              >
                Ver detalle
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-lux-hover/40 bg-lux-surface shadow-2xl lg:block">
        <table className="w-full text-left whitespace-nowrap">
          <thead>
            <tr className="border-b border-lux-hover/60 bg-[#1f1f1e] text-[11px] font-semibold uppercase tracking-widest text-lux-sec">
              <th className="px-6 py-4">Merchant</th>
              <th className="px-6 py-4">Wallet</th>
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Descripcion</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4">Monto</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-lux-hover/30 text-sm font-light">
            {transactions.map((transaction) => (
              <tr className="transition-colors duration-300 hover:bg-lux-hover/20" key={transaction.id}>
                <td className="px-6 py-4">
                  {renderMerchantTrigger(transaction, setMerchantAssignmentTarget)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {renderWalletAvatar(transaction)}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{renderWalletLabel(transaction)}</p>
                      <p className="truncate text-xs text-lux-sec">{transaction.wallet?.kind ?? "-"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-lux-sec">{transaction.user?.email ?? "-"}</td>
                <td className="max-w-[300px] px-6 py-4 text-white">
                  <span className="block truncate" title={transaction.description ?? ""}>
                    {transaction.description ?? "-"}
                  </span>
                </td>
                <td className="px-6 py-4">{renderCategory(transaction)}</td>
                <td className="px-6 py-4 font-medium">{renderSignedAmount(transaction.amount)}</td>
                <td className="px-6 py-4">{renderKindBadges(transaction)}</td>
                <td className="px-6 py-4 text-lux-sec">{formatDate(transaction.date)}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      className="btn btn-sm border-lux-hover bg-lux-bg text-white hover:border-lux-gold/50 hover:text-lux-gold"
                      onClick={() => setDetailTransaction(transaction)}
                      type="button"
                    >
                      Ver detalle
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AssignMerchantModal
        isOpen={merchantAssignmentTarget !== null}
        onClose={() => setMerchantAssignmentTarget(null)}
        transactionDescription={merchantAssignmentTarget?.description ?? null}
        transactionId={merchantAssignmentTarget?.id ?? null}
      />

      <TransactionDetailModal
        isOpen={detailTransaction !== null}
        onClose={() => setDetailTransaction(null)}
        transaction={detailTransaction}
      />
    </>
  );
}
