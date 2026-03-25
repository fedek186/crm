
import { requireAuthenticatedAdminPage } from "@/app/lib/auth";
import { getUserProfile } from "@/app/services/userService";
import { notFound } from "next/navigation";
import CardContacto from "@/app/components/CardContacto";
import AddContactModal from "@/app/components/AddContactModal";
import BackButton from "@/app/components/BackButton";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProfilePage({ params }: Props) {
  await requireAuthenticatedAdminPage();
  const { id } = await params;
  const user = await getUserProfile(id);
  if (!user) {
    return notFound();
  }

  return (
    <div className="h-screen bg-lux-bg text-lux-text p-4 md:p-8 lg:px-12 font-sans selection:bg-lux-gold selection:text-lux-bg flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-[1050px] max-h-full mx-auto bg-lux-surface rounded-xl shadow-2xl border border-lux-hover/40 p-6 lg:p-8 flex flex-col">

        {/* Cabecera, Nombre y Apellido se mantienen arriba */}
        <div className="mb-6 lg:mb-8 border-b border-lux-hover/50 pb-4 lg:pb-6 flex items-center shrink-0">
          <BackButton />
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight drop-shadow-sm flex flex-wrap items-center">
            Perfil: <span className="text-lux-gold ml-2">{user.name || "Sin nombre"} {user.surname || ""}</span>
          </h1>
        </div>

        {/* División principal en dos columnas (Información vs Contactos) */}
        <div className="flex-1 overflow-y-auto pr-1 lg:pr-3 w-full">
          <div className="flex flex-col lg:flex-row gap-8 items-start relative">
            
            {/* Lado Izquierdo: Información del Usuario */}
            <div className="flex-1 w-full space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-lux-bg p-5 rounded-lg border border-lux-hover/30">
              <div>
                <span className="text-lux-sec text-[11px] block uppercase tracking-wider font-semibold mb-1">Registro Inicial</span>
                <span className="text-white font-medium text-sm">{user.created_at ? user.created_at.toLocaleString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-lux-sec text-[11px] block uppercase tracking-wider font-semibold mb-1">Última Sincronización</span>
                <span className="text-white font-medium text-sm">{user.last_update ? user.last_update.toLocaleString() : 'N/A'}</span>
              </div>
              <div className="col-span-1 sm:col-span-2 border-t border-lux-hover/20 my-1 hidden sm:block"></div>
              <div>
                <span className="text-lux-sec text-[11px] block uppercase tracking-wider font-semibold mb-1">Email</span>
                <span className="text-white font-medium break-all text-sm">{user.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-lux-sec text-[11px] block uppercase tracking-wider font-semibold mb-1">Teléfono (Phone)</span>
                <span className="text-white font-medium text-sm">{user.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-lux-sec text-[11px] block uppercase tracking-wider font-semibold mb-1">País (Country)</span>
                <span className="text-white font-medium text-sm">{user.country || 'N/A'}</span>
              </div>
              <div>
                 <span className="text-lux-sec text-[11px] block uppercase tracking-wider font-semibold mb-1">Mercado Pago (MP)</span>
                <span className="text-white font-medium text-sm">{user.mp ? 'Sí, activado' : 'No'}</span>
              </div>
            </div>

            <div className="bg-lux-bg p-5 rounded-lg border border-lux-hover/30">
              <h3 className="text-lux-sec text-xs uppercase tracking-widest font-bold mb-4 border-b border-lux-hover/30 pb-3">Estadísticas de transacciones</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center justify-center bg-lux-bg p-3 rounded border border-lux-hover/20">
                  <span className="text-lux-sec text-[10px] uppercase font-bold mb-1">Diarias</span>
                  <span className="text-white font-bold text-lg">{user.daily_trans || 0}</span>
                </div>
                <div className="flex flex-col items-center justify-center bg-lux-bg p-3 rounded border border-lux-hover/20">
                  <span className="text-lux-sec text-[10px] uppercase font-bold mb-1">Semanales</span>
                  <span className="text-white font-bold text-lg">{user.week_trans || 0}</span>
                </div>
                <div className="flex flex-col items-center justify-center bg-lux-bg p-3 border border-lux-gold/30 rounded shadow-[0_0_10px_rgba(241,111,132,0.08)]">
                  <span className="text-lux-gold font-bold text-[10px] uppercase tracking-wide mb-1">Mensuales</span>
                  <span className="text-lux-gold font-bold text-2xl">{user.monthly_trans || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Spacer para mantener el flujo en flex y reservar el espacio a la derecha */}
          <div className="hidden lg:block w-[400px] shrink-0 pointer-events-none"></div>

          {/* Lado Derecho: Contactos (Scrolleable) absolute posicionado dentro del flex container */}
          <div className="mt-8 lg:mt-0 lg:absolute lg:top-0 lg:right-0 lg:bottom-0 w-full lg:w-[400px] border border-lux-hover/40 rounded-xl bg-lux-surface flex flex-col h-[400px] lg:h-auto shadow-inner overflow-hidden">
            {/* Cabecera sticky del contenedor derecho */}
            <div className="px-6 py-5 border-b border-lux-hover/40 bg-lux-surface flex justify-between items-center z-10">
              <h3 className="text-white font-bold tracking-tight text-lg">Contactos</h3>
              <AddContactModal userId={user.user_id as string} />
            </div>

            {/* Lista Scrolleable */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {user.contacts && user.contacts.length > 0 ? (
                user.contacts.map((c, i) => (
                  <CardContacto
                    key={c.id}
                    id={c.id}
                    userId={user.user_id as string}
                    numero={user.contacts.length - i}
                    objetivo={c.objective}
                    media={c.media}
                    fechaInicio={c.start_date}
                    fechaFin={c.end_date}
                    estado={c.state}
                    notesText={c.notes}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-70 p-6">
                  <div className="w-14 h-14 rounded-full border border-lux-hover/50 flex items-center justify-center mb-4 bg-lux-surface shadow-inner">
                    <span className="text-lux-gold text-2xl font-serif italic">i</span>
                  </div>
                  <p className="text-lux-sec text-sm tracking-wide font-medium">Aún no hay interacciones registradas con este cliente.</p>
                  <p className="text-lux-muted text-xs mt-2">Haz clic en <strong>+ Añadir</strong> para iniciar el historial.</p>
                </div>
              )}
            </div>
          </div>

        </div>
        </div>
      </div>
    </div>
  );
}
