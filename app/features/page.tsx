/*
Este archivo renderiza la página de analytics de features del CRM.
Autentica al admin y monta el coordinador de gráficos y breakdowns dinámicamente.

Elementos externos:
- requireAuthenticatedAdminPage: valida que solo accedan administradores autenticados.
- FeaturesView: coordinador cliente que gestiona gráfico y tabla de detalle (importado vía dynamic).
- PageShell / PageHeader: layout estándar del CRM.
*/

import dynamic from "next/dynamic";
import { requireAuthenticatedAdminPage } from "@/app/lib/auth";
import PageShell from "@/app/components/ui/PageShell";
import PageHeader from "@/app/components/ui/PageHeader";

const FeaturesView = dynamic(() => import("@/app/components/features/FeaturesView"), {
  loading: () => (
    <div className="w-full h-[350px] flex items-center justify-center bg-lux-surface rounded-xl border border-lux-hover/30">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-lux-gold" />
        <p className="text-lux-sec text-sm">Cargando módulo de features...</p>
      </div>
    </div>
  ),
});

export default async function FeaturesPage() {
  await requireAuthenticatedAdminPage();

  return (
    <PageShell>
      <PageHeader
        title="Features"
        subtitle="Analizá el uso de funcionalidades del producto por usuarios únicos y volumen de actividad."
      />
      <FeaturesView />
    </PageShell>
  );
}
