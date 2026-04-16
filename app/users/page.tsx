/* 
Este archivo renderiza la pantalla principal de usuarios del panel de administración.
      Protege el acceso para que solo entren administradores, muestra la tabla principal
      de usuarios y permite filtrar, ordenar, paginar y navegar a la ficha individual.
      
      Elementos externos:
      - requireAuthenticatedAdminPage: valida que la página solo pueda ser vista por un administrador autenticado.
      - getUsersFromNeon: obtiene desde la base analítica los usuarios y la información necesaria para listar la tabla.
      - getSupabaseData: ejecuta la sincronización de datos cuando el usuario aprieta el botón correspondiente.
      - SearchTableInput: provee el buscador de la tabla.
      - SortableHeader: permite ordenar columnas desde la cabecera.
      - Pagination: muestra la navegación entre páginas del listado.
*/

import Link from "next/link";
import { requireAuthenticatedAdminPage } from "../lib/auth";
import { getUsersFromNeon } from "../services/userService";
import SearchTableInput from "../components/SearchTableInput";
import SortableHeader from "../components/SortableHeader";
import Pagination from "../components/Pagination";
import UserFilters from "../components/UserFilters";
import { prisma } from "../lib/prisma";

const getStateBadge = (state: string | null | undefined) => {
  switch (state) {
    case 'NeverUsed':
      return <span className="px-2 py-0.5 rounded-full border border-gray-500/40 text-gray-400 text-[10px] uppercase tracking-wider">Never Used</span>;
    case 'New':
      return <span className="px-2 py-0.5 rounded-full border border-purple-500/40 text-purple-400 text-[10px] uppercase tracking-wider">New</span>;
    case 'Active':
      return <span className="px-2 py-0.5 rounded-full border border-green-500/40 text-green-400 text-[10px] uppercase tracking-wider">Active</span>;
    case 'AtRisk':
      return <span className="px-2 py-0.5 rounded-full border border-orange-500/40 text-orange-400 text-[10px] uppercase tracking-wider">At Risk</span>;
    case 'Churned':
      return <span className="px-2 py-0.5 rounded-full border border-red-500/40 text-red-500 text-[10px] uppercase tracking-wider">Churned</span>;
    default:
      return <span className="px-2 py-0.5 rounded-full border border-gray-500/40 text-gray-500 text-[10px] uppercase tracking-wider">{state || 'Unknown'}</span>;
  }
};

export default async function Home(props: { searchParams?: Promise<{ [key: string]: string | undefined }> }) {
  await requireAuthenticatedAdminPage();
  const searchParams = (await props.searchParams) || {};

  const page = Number(searchParams.page) || 1;
  const search = searchParams.search || "";
  const sort = searchParams.sort || "created_at";
  const dir = searchParams.dir === "asc" ? false : true; // true implies desc by default

  const filterCol = searchParams.filterCol;
  const filterOp = searchParams.filterOp;
  const filterVal = searchParams.filterVal;

  const { users, totalPages } = await getUsersFromNeon({
    page,
    limit: 50,
    search,
    sortBy: sort,
    sortDesc: dir,
    filterCol,
    filterOp,
    filterVal
  });



  return (
    <div className="min-h-screen bg-lux-bg text-lux-text p-6 md:p-12 selection:bg-lux-gold selection:text-lux-bg">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight text-white drop-shadow-sm">
              Usuarios
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto mt-4 md:mt-0">
            <SearchTableInput />
          </div>
        </div>

        <UserFilters />

        <div className="bg-lux-surface rounded-xl shadow-2xl border border-lux-hover/40 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-lux-hover/60 text-[11px] font-semibold uppercase tracking-widest text-lux-sec bg-lux-surface">
                  <SortableHeader title="ID" column="id" />
                  <SortableHeader title="Estado" column="state" />
                  <SortableHeader title="Nombre" column="name" />
                  <SortableHeader title="Apellido" column="surname" />
                  <SortableHeader title="Email" column="email" />
                  <SortableHeader title="Teléfono" column="phone" />
                  <SortableHeader title="Diario" column="daily_trans" />
                  <SortableHeader title="Semanal" column="week_trans" />
                  <SortableHeader title="Mes" column="monthly_trans" />
                  <SortableHeader title="MP" column="mp" />
                  <SortableHeader title="Ingreso" column="created_at" />
                  <SortableHeader title="Contactos" column="contacts" />
                  <th className="px-6 py-4 font-medium">Último</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lux-hover/30 text-sm font-light">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-lux-hover/20 transition-colors duration-300">
                    <td className="px-6 py-4 text-lux-muted text-xs">{user.id}</td>
                    <td className="px-6 py-4">{getStateBadge(user.state)}</td>
                    <td className="px-6 py-4 text-white font-medium">{user.name || "-"}</td>
                    <td className="px-6 py-4 text-white font-medium">{user.surname || "-"}</td>
                    <td className="px-6 py-4 text-lux-sec text-xs">{user.email || "-"}</td>
                    <td className="px-6 py-4 text-lux-sec text-xs">{user.phone || "-"}</td>
                    <td className="px-6 py-4">{user.daily_trans || 0}</td>
                    <td className="px-6 py-4">{user.week_trans || 0}</td>
                    <td className="px-6 py-4 text-lux-gold font-medium">{user.monthly_trans || 0}</td>
                    <td className="px-6 py-4">
                      {user.mp ? <span className="px-2 py-0.5 rounded-full border border-lux-gold/40 text-lux-gold text-[10px] uppercase tracking-wider">Sí</span> : <span className="text-lux-muted text-[10px] uppercase tracking-wider">No</span>}
                    </td>
                    <td className="px-6 py-4 text-lux-sec text-xs">{user.created_at ? user.created_at.toLocaleDateString('es-AR') : "-"}</td>
                    <td className="px-6 py-4 text-white text-center font-bold">
                      {user._count?.contacts || 0}
                    </td>
                    <td className="px-6 py-4 text-lux-sec text-xs font-medium">
                      {user.contacts && user.contacts.length > 0 && user.contacts[0].start_date
                        ? user.contacts[0].start_date.toLocaleDateString('es-AR')
                        : "null"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/profile/${user.user_id}`} className="inline-flex items-center text-[11px] font-medium text-lux-sec hover:text-lux-gold transition-colors border border-lux-hover px-3 py-1.5 rounded hover:border-lux-gold/50 uppercase tracking-wider">
                        Ver ficha
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}
