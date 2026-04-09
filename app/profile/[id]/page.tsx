/*
Este archivo renderiza la pantalla de perfil individual de un usuario dentro del panel de administración.
Protege el acceso para tener visualización exclusiva de administradores. Muestra los datos de contacto, métricas del usuario en una vista integrada, el gráfico de transacciones históricas filtrables y permite gestionar su historial interactivo.

Elementos externos:
- requireAuthenticatedAdminPage: valida que la página solo pueda ser vista por un administrador autenticado.
- getUserProfile: obtiene la información básica, métricas y contactos previos del usuario.
- getUserTransactionHistory: obtiene el mapeo diario de transacciones para el gráfico histórico.
- UserTransactionChart: provee un gráfico con la línea de tiempo interactiva de actividad del usuario.
- CardContacto: renderiza cada entrada individual del historial de comunicaciones en el listado derecho.
- AddContactModal: modal para la creación de nuevas notas o interacciones asociadas al usuario actual.
- BackButton: botón para retornar al listado de usuarios.

Funciones exportadas:
- ProfilePage: renderiza asíncronamente la página, unificando consultas a base de datos y sirviendo el contenedor responsivo principal.
*/
import { requireAuthenticatedAdminPage } from "@/app/lib/auth";
import { getUserProfile, getUserTransactionHistory } from "@/app/services/userService";
import { notFound } from "next/navigation";
import CardContacto from "@/app/components/CardContacto";
import AddContactModal from "@/app/components/AddContactModal";
import BackButton from "@/app/components/BackButton";
import UserTransactionChart from "@/app/components/UserTransactionChart";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProfilePage({ params }: Props) {
  await requireAuthenticatedAdminPage();
  const { id } = await params;
  
  const [user, transactionSeries] = await Promise.all([
    getUserProfile(id),
    getUserTransactionHistory(id)
  ]);

  if (!user) {
    return notFound();
  }

  return (
    <div className="h-screen bg-lux-bg text-lux-text p-4 md:p-6 lg:px-8 font-sans selection:bg-lux-gold selection:text-lux-bg flex flex-col overflow-hidden">
      <div className="w-full max-w-[1400px] h-full mx-auto bg-lux-surface rounded-xl shadow-2xl border border-lux-hover/40 p-4 lg:p-6 flex flex-col overflow-hidden">

        {/* Cabecera */}
        <div className="mb-4 lg:mb-5 border-b border-lux-hover/50 pb-3 lg:pb-4 flex items-center shrink-0">
          <BackButton />
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm flex flex-wrap items-center">
            Perfil: <span className="text-lux-gold ml-2">{user.name || "Sin nombre"} {user.surname || ""}</span>
          </h1>
        </div>

        {/* División principal */}
        <div className="flex-1 overflow-hidden w-full">
          <div className="flex flex-col lg:flex-row gap-5 h-full relative">
            
            {/* Lado Izquierdo: Información + Gráfico */}
            <div className="flex-1 w-full flex flex-col gap-5 h-full overflow-hidden shrink-0 lg:shrink">
              
              {/* Top Row: Info & Stats (3 columnas elegantes) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 shrink-0">
                {/* Tarjeta de Contacto */}
                <div className="bg-lux-bg p-4 md:p-5 rounded-xl border border-lux-hover/30 flex flex-col">
                  <h3 className="text-lux-sec text-[10px] uppercase tracking-widest font-bold mb-4 border-b border-lux-hover/20 pb-2">Datos de Contacto</h3>
                  <div className="space-y-3 flex-1 flex flex-col justify-center">
                     <div>
                       <span className="text-lux-muted text-[10px] block font-medium mb-0.5">Email</span>
                       <span className="text-white font-medium break-all text-xs md:text-[13px]">{user.email || 'N/A'}</span>
                     </div>
                     <div>
                       <span className="text-lux-muted text-[10px] block font-medium mb-0.5">Teléfono</span>
                       <span className="text-white font-medium text-xs md:text-[13px]">{user.phone || 'N/A'}</span>
                     </div>
                     <div>
                       <span className="text-lux-muted text-[10px] block font-medium mb-0.5">País</span>
                       <span className="text-white font-medium text-xs md:text-[13px]">{user.country || 'N/A'}</span>
                     </div>
                  </div>
                </div>

                {/* Tarjeta de Estado e Integración */}
                <div className="bg-lux-bg p-4 md:p-5 rounded-xl border border-lux-hover/30 flex flex-col">
                  <h3 className="text-lux-sec text-[10px] uppercase tracking-widest font-bold mb-4 border-b border-lux-hover/20 pb-2">Estado de Cuenta</h3>
                  <div className="space-y-3 flex-1 flex flex-col justify-center">
                     <div>
                       <span className="text-lux-muted text-[10px] block font-medium mb-1">Mercado Pago (MP)</span>
                       <div className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${user.mp ? 'bg-lux-gold/20 text-lux-gold border border-lux-gold/20' : 'bg-red-500/10 text-red-400 border border-red-500/10'}`}>
                         {user.mp ? 'Vinculado' : 'No Vinculado'}
                       </div>
                     </div>
                     <div>
                       <span className="text-lux-muted text-[10px] block font-medium mb-0.5">Registro Inicial</span>
                       <span className="text-white font-medium text-xs truncate">{user.created_at ? user.created_at.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</span>
                     </div>
                     <div>
                       <span className="text-lux-muted text-[10px] block font-medium mb-0.5">Última Sincronización</span>
                       <span className="text-white font-medium text-xs truncate">{user.last_update ? user.last_update.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</span>
                     </div>
                  </div>
                </div>

                {/* Tarjeta de Transacciones Estadísticas */}
                <div className="bg-lux-bg p-4 md:p-5 rounded-xl border border-lux-hover/30 flex flex-col shadow-inner">
                  <h3 className="text-lux-sec text-[10px] uppercase tracking-widest font-bold mb-4 border-b border-lux-hover/20 pb-2">Transacciones</h3>
                  <div className="flex flex-col gap-2.5 h-full justify-center">
                    <div className="flex items-center justify-between bg-lux-surface border border-lux-hover/20 px-3 py-1.5 rounded">
                      <span className="text-lux-muted text-[10px] font-bold uppercase">Diarias</span>
                      <span className="text-white font-bold text-sm">{user.daily_trans || 0}</span>
                    </div>
                    <div className="flex items-center justify-between bg-lux-surface border border-lux-hover/20 px-3 py-1.5 rounded">
                      <span className="text-lux-muted text-[10px] font-bold uppercase">Semanales</span>
                      <span className="text-white font-bold text-sm">{user.week_trans || 0}</span>
                    </div>
                    <div className="flex items-center justify-between bg-lux-gold/10 border border-lux-gold/30 px-3 py-2 rounded shadow-[0_0_10px_rgba(212,175,55,0.06)] relative overflow-hidden">
                      <div className="absolute left-0 top-0 w-1 h-full bg-lux-gold shadow-[0_0_8px_rgba(212,175,55,1)]"></div>
                      <span className="text-lux-gold font-bold text-[10px] uppercase tracking-wide ml-1">Mensuales</span>
                      <span className="text-lux-gold font-bold text-lg">{user.monthly_trans || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico de Transacciones pasadas */}
              <div className="flex-1 overflow-hidden min-h-[200px] border border-lux-hover/40 rounded-xl bg-lux-surface shadow-inner relative">
                {(() => {
                  const contactDates = user.contacts 
                    ? user.contacts
                        .map(c => c.start_date ? c.start_date.toISOString().split("T")[0] : null)
                        .filter(Boolean) as string[]
                    : [];
                  return <UserTransactionChart data={transactionSeries} contactDates={contactDates} className="h-full" />;
                })()}
              </div>
              
            </div>

            {/* Lado Derecho: Contactos */}
            <div className="w-full lg:w-[380px] border border-lux-hover/40 rounded-xl bg-lux-surface flex flex-col h-full shadow-inner overflow-hidden shrink-0">
              {/* Cabecera sticky del contenedor derecho */}
              <div className="px-5 py-4 border-b border-lux-hover/40 bg-lux-surface flex justify-between items-center z-10 shrink-0">
                <h3 className="text-white font-bold tracking-tight text-base">Contactos</h3>
                <AddContactModal userId={user.user_id as string} />
              </div>

              {/* Lista Scrolleable */}
              <div className="p-4 overflow-y-auto flex-1 space-y-3">
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
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-70 p-4">
                    <div className="w-12 h-12 rounded-full border border-lux-hover/50 flex items-center justify-center mb-3 bg-lux-surface shadow-inner">
                      <span className="text-lux-gold text-xl font-serif italic">i</span>
                    </div>
                    <p className="text-lux-sec text-xs tracking-wide font-medium">Aún no hay interacciones.</p>
                    <p className="text-lux-muted text-[10px] mt-1">Haz clic en <strong>+ Añadir</strong> para iniciar el historial.</p>
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
