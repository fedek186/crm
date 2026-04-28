/*
Este archivo renderiza la página principal del catálogo de merchants del CRM.
Protege el acceso para administradores, obtiene el listado paginado y lo inyecta en el componente de lista.

Elementos externos:
- requireAuthenticatedAdminPage: valida que la página solo pueda ser vista por un administrador autenticado.
- getMerchants: obtiene la lista paginada de merchants desde Supabase.
- MerchantList: componente cliente que renderiza la grilla de merchants con acciones CRUD.
- PageShell: wrapper base con fondo y layout estándar del CRM.
- PageHeader: encabezado estándar con título y slot derecho para acciones.
- PageError: bloque de error estándar para fallo en la carga del módulo.
*/

import Pagination from "@/app/components/Pagination";
import MerchantList from "@/app/components/merchants/MerchantList";
import MerchantCreateButton from "@/app/components/merchants/MerchantCreateButton";
import PageShell from "@/app/components/ui/PageShell";
import PageHeader from "@/app/components/ui/PageHeader";
import PageError from "@/app/components/ui/PageError";
import SearchTableInput from "@/app/components/SearchTableInput";
import { requireAuthenticatedAdminPage } from "@/app/lib/auth";
import { getMerchantErrorMessage, getMerchants } from "@/app/services/merchant.service";

type MerchantsPageProps = {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
};

export default async function MerchantsPage(props: MerchantsPageProps) {
  await requireAuthenticatedAdminPage();
  const searchParams = (await props.searchParams) || {};
  const page = Number(searchParams.page) || 1;
  const search = searchParams.search || "";

  try {
    const { merchants, totalPages } = await getMerchants({
      limit: 12,
      page,
      search,
    });

    return (
      <PageShell>
        <PageHeader
          title="Merchants"
          subtitle="Gestioná merchants, dominios y aliases desde un solo lugar."
          right={
            <>
              <SearchTableInput placeholder="Buscar por nombre, URL o tag..." />
              <MerchantCreateButton />
            </>
          }
        />
        <div className="space-y-6">
          <MerchantList merchants={merchants} />
          <Pagination totalPages={totalPages} />
        </div>
      </PageShell>
    );
  } catch (error) {
    const message = getMerchantErrorMessage(
      error,
      "No pudimos cargar los merchants en este momento."
    );

    return (
      <PageShell>
        <PageError title="No se pudo cargar el módulo de merchants" message={message} />
      </PageShell>
    );
  }
}
