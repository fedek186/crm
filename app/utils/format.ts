/*
Este archivo provee funciones utilitarias puras de formateo sin dependencias de React ni de la UI.
Centraliza la lógica de presentación de fechas, números y strings usada en múltiples módulos del CRM.

Funciones exportadas:
- formatDateAR: formatea un Date o string ISO a formato local argentino (dd/mm/aaaa).
- formatCurrency: formatea un número como moneda con separadores de miles.
- truncateText: corta un texto a un máximo de caracteres y agrega puntos suspensivos.
*/

export function formatDateAR(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}

export function formatCurrency(amount: number, currency = "ARS"): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return "-";
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}
