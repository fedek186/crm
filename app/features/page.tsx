/*
Este archivo renderiza la página de análisis de features del CRM.
Muestra el uso de funcionalidades del producto por usuarios y volumen de transacciones.

Elementos externos:
- PageShell: wrapper base con fondo y layout estándar del CRM.
- PageHeader: encabezado estándar con título y subtítulo.
*/

import PageShell from "@/app/components/ui/PageShell";
import PageHeader from "@/app/components/ui/PageHeader";

export default async function FeaturesPage() {
  return (
    <PageShell>
      <PageHeader
        title="Features"
        subtitle="Analizá el uso de funcionalidades del producto por usuarios y volumen de transacciones."
      />
    </PageShell>
  );
}
