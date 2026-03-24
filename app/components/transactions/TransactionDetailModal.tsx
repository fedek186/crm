"use client";

import { useState } from "react";
import type { TransactionDetail } from "@/app/lib/transaction";
import Link from "next/link";

type TransactionDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionDetail | null;
};

const detailDateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
  year: "numeric",
});

const HIDDEN_AMOUNT_LABEL = "***";

function renderValue(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : "-";
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return detailDateFormatter.format(new Date(value));
}

function formatRawData(value: TransactionDetail["rawData"]): string {
  if (value === null) {
    return "null";
  }

  return JSON.stringify(value, null, 2);
}

function renderSignedAmount(amount: number) {
  const isPositive = amount > 0;
  const isNegative = amount < 0;
  const prefix = isPositive ? "+" : isNegative ? "-" : "";
  const colorClassName = isPositive ? "text-emerald-400" : "text-white";

  return (
    <span className={colorClassName}>{`${prefix}${HIDDEN_AMOUNT_LABEL}`}</span>
  );
}

function renderWalletKindIcon(kind: string | null) {
  const baseClassName =
    "flex h-12 w-12 items-center justify-center rounded-xl border border-lux-hover/30 bg-lux-bg text-lux-sec";

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
        className="h-12 w-12 rounded-xl border border-lux-hover/30 bg-white object-contain p-2"
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
    "-"
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-lux-sec">
        {label}
      </p>
      <p className="break-words text-sm text-white">{value}</p>
    </div>
  );
}

export default function TransactionDetailModal({
  isOpen,
  onClose,
  transaction,
}: TransactionDetailModalProps) {
  const [copyFeedback, setCopyFeedback] = useState<"idle" | "copied" | "error">("idle");

  if (!isOpen || !transaction) {
    return null;
  }

  const rawDataValue = formatRawData(transaction.rawData);

  const handleCopyRawData = async () => {
    try {
      await navigator.clipboard.writeText(rawDataValue);
      setCopyFeedback("copied");
      window.setTimeout(() => setCopyFeedback("idle"), 1500);
    } catch {
      setCopyFeedback("error");
      window.setTimeout(() => setCopyFeedback("idle"), 1500);
    }
  };

  return (
    <dialog className="modal modal-open" open>
      <div className="modal-box w-11/12 max-w-4xl border border-lux-hover/40 bg-lux-surface p-0 text-white shadow-2xl">
        <div className="border-b border-lux-hover/30 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-lux-gold">Detalle de transaccion</h3>
              <p className="mt-1 text-sm text-lux-sec">
                {renderValue(transaction.description)}
              </p>
            </div>
            <button
              className="btn btn-circle btn-ghost btn-sm text-lux-sec hover:text-white"
              onClick={onClose}
              type="button"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-5 py-5 sm:px-6">
          <div className="rounded-2xl border border-lux-hover/30 bg-lux-bg/70 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-lux-sec">
                    Merchant
                  </p>
                  {transaction.merchant ? (
                    <div className="flex items-center gap-3">
                      {transaction.merchant.logoUrl ? (
                        <img
                          alt={`Logo de ${transaction.merchant.name ?? "merchant"}`}
                          className="h-14 w-14 rounded-2xl border border-lux-hover/30 bg-white object-contain p-2"
                          src={transaction.merchant.logoUrl}
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-lux-gold/40 bg-lux-bg text-lux-gold">
                          <svg
                            aria-hidden="true"
                            className="h-6 w-6"
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
                      )}
                      <div>
                        <Link
                          className="font-semibold text-white transition-colors hover:text-lux-gold"
                          href={`/merchants?search=${encodeURIComponent(transaction.merchant.name ?? "")}`}
                        >
                          {transaction.merchant.name ?? "Merchant sin nombre"}
                        </Link>
                        <p className="text-sm text-lux-sec">{renderValue(transaction.merchant.domain)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-lux-sec">Sin merchant asignado</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-lux-sec">
                    Wallet
                  </p>
                  {transaction.wallet ? (
                    <div className="flex items-center gap-3">
                      {renderWalletAvatar(transaction)}
                      <div>
                        <p className="font-semibold text-white">{renderWalletLabel(transaction)}</p>
                        <p className="text-sm text-lux-sec">{renderValue(transaction.wallet.kind)}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-lux-sec">Sin wallet asociada</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-lux-gold/20 bg-lux-surface px-5 py-4 text-right shadow-[0_0_20px_rgba(241,111,132,0.08)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-lux-sec">
                  Monto
                </p>
                <p className="mt-2 text-2xl font-bold tracking-[0.28em]">
                  {renderSignedAmount(transaction.amount)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-5 rounded-2xl border border-lux-hover/30 bg-lux-bg/70 p-5 md:grid-cols-2 xl:grid-cols-3">
            <DetailField label="ID" value={transaction.id} />
            <DetailField label="Usuario" value={renderValue(transaction.user?.email)} />
            <DetailField label="Descripcion" value={renderValue(transaction.description)} />
            <DetailField label="Wallet" value={renderWalletLabel(transaction)} />
            <DetailField label="Tipo wallet" value={renderValue(transaction.wallet?.kind)} />
            <DetailField
              label="Categoria"
              value={
                transaction.category
                  ? `${transaction.category.emoji ?? ""} ${transaction.category.name ?? ""}`.trim() || "-"
                  : "-"
              }
            />
            <DetailField label="Tipo" value={renderValue(transaction.transactionKind)} />
            <DetailField label="Estado" value={renderValue(transaction.status)} />
            <DetailField label="Fecha" value={formatDate(transaction.date)} />
            <DetailField label="Creado" value={formatDate(transaction.createdAt)} />
            <DetailField label="Actualizado" value={formatDate(transaction.updatedAt)} />
            <DetailField label="Pais" value={renderValue(transaction.country)} />
            <DetailField label="Referencia externa" value={renderValue(transaction.externalRef)} />
          </div>

          <div className="mt-5 rounded-2xl border border-lux-hover/30 bg-lux-bg/70 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-lux-sec">
                  Raw data
                </p>
                <p className="mt-1 text-sm text-lux-sec">
                  Payload original asociado a la transacción.
                </p>
              </div>

              <button
                className="btn btn-sm border-lux-hover bg-lux-surface text-white hover:border-lux-gold/50 hover:text-lux-gold"
                onClick={handleCopyRawData}
                type="button"
              >
                {copyFeedback === "copied"
                  ? "Copiado"
                  : copyFeedback === "error"
                    ? "Error al copiar"
                    : "Copiar"}
              </button>
            </div>

            <pre className="mt-4 overflow-x-auto rounded-2xl border border-lux-hover/30 bg-[#171717] p-4 text-xs leading-6 text-lux-sec">
              <code>{rawDataValue}</code>
            </pre>
          </div>
        </div>
      </div>

      <form className="modal-backdrop bg-black/70 backdrop-blur-sm" method="dialog">
        <button onClick={onClose} type="button">
          close
        </button>
      </form>
    </dialog>
  );
}
