import Pagination from "@/app/components/Pagination";
import MerchantList from "@/app/components/merchants/MerchantList";
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
      <div className="min-h-screen bg-base-200 px-6 py-10">
        <div className="mx-auto max-w-7xl space-y-6">
          <MerchantList merchants={merchants} />
          <Pagination totalPages={totalPages} />
        </div>
      </div>
    );
  } catch (error) {
    const message = getMerchantErrorMessage(
      error,
      "No pudimos cargar los merchants en este momento."
    );

    return (
      <div className="min-h-screen bg-base-200 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="alert alert-error shadow-sm">
            <div className="space-y-2">
              <h1 className="text-base font-semibold">No se pudo cargar el modulo de merchants</h1>
              <p className="text-sm">{message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
