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
    <div className="min-h-screen lg:h-screen bg-lux-bg text-lux-text p-3 sm:p-4 md:p-6 lg:px-8 font-sans selection:bg-lux-gold selection:text-lux-bg flex flex-col lg:overflow-hidden">
      <div className="w-full max-w-[1400px] flex-1 mx-auto bg-lux-surface rounded-xl shadow-2xl border border-lux-hover/40 p-4 lg:p-6 flex flex-col lg:overflow-hidden">

        {/* Cabecera con Badges de Estado */}
        <div className="mb-4 lg:mb-5 border-b border-lux-hover/50 pb-3 lg:pb-4 flex flex-col xl:flex-row xl:items-end justify-between gap-4 shrink-0">
          <div className="flex items-start">
            <div className="mt-1 mr-2 sm:mt-1.5 sm:mr-3">
              <BackButton />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="truncate">Perfil: <span className="text-lux-gold">{user.name || "Sin nombre"} {user.surname || ""}</span></span>
                {(() => {
                  const stateConfig = {
                    NeverUsed: { label: 'Sin USO', color: 'bg-lux-surface text-lux-muted border-lux-hover/50' },
                    New: { label: 'Nuevo', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30' },
                    Active: { label: 'Activo', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
                    ActivePlus: { label: 'Activo+', color: 'bg-teal-500/20 text-teal-300 border-teal-400/30' },
                    AtRisk: { label: 'En Riesgo', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
                    Churned: { label: 'Inactivo', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
                  }[user.state as string || 'NeverUsed'] || { label: 'Desconocido', color: 'bg-lux-surface text-lux-muted border-lux-hover/50' };
                  
                  return (
                    <span className={`px-2.5 py-0.5 text-[9px] sm:text-[10px] shrink-0 uppercase font-bold tracking-widest rounded shadow-sm border ${stateConfig.color}`}>
                      {stateConfig.label}
                    </span>
                  );
                })()}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-1.5 text-[10px] sm:text-[11px] text-lux-muted font-medium w-full">
                <span className="whitespace-nowrap"><strong className="text-lux-sec/80 font-semibold">Registro:</strong> {user.created_at ? user.created_at.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</span>
                <span className="hidden sm:block w-1 h-1 bg-lux-hover rounded-full"></span>
                <span className="whitespace-nowrap"><strong className="text-lux-sec/80 font-semibold">Última Sync:</strong> {user.last_update ? user.last_update.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</span>
                <span className="hidden sm:block w-1 h-1 bg-lux-hover rounded-full"></span>
                <span className="flex items-center gap-1 shrink-0">
                  <strong className="text-lux-sec/80 font-semibold">MP:</strong>
                  <span className={`w-2 h-2 rounded-full ${user.mp ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* División principal */}
        <div className="flex-1 lg:overflow-hidden w-full">
          <div className="flex flex-col lg:flex-row gap-5 h-auto lg:h-full relative">
            
            {/* Lado Izquierdo: Información + Gráfico */}
            <div className="flex-1 w-full flex flex-col gap-4 h-auto lg:h-full lg:overflow-hidden shrink-0">
              
              {/* Top Row: Tarjetas de Resumen (Grid 3 columnas) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
                {/* 1. Datos Personales */}
                <div className="bg-lux-bg p-4 rounded-xl border border-lux-hover/30 flex flex-col justify-between group hover:border-lux-hover/70 transition-colors">
                  <div className="flex items-center gap-2 mb-3 border-b border-lux-hover/20 pb-2">
                    <div className="w-6 h-6 rounded-md bg-lux-surface flex items-center justify-center border border-lux-hover/50 text-lux-sec text-xs">@</div>
                    <h3 className="text-lux-sec text-[10px] uppercase tracking-widest font-bold">Resumen de Contacto</h3>
                  </div>
                  <div className="space-y-2 flex-1 flex flex-col justify-center">
                     <div className="flex justify-between items-center bg-lux-surface/30 px-2.5 py-1.5 rounded">
                       <span className="text-lux-muted text-[10px] font-medium">Email</span>
                       <span className="text-white font-medium text-[11px] truncate max-w-[120px] lg:max-w-[180px]" title={user.email || 'N/A'}>{user.email || 'N/A'}</span>
                     </div>
                     <div className="flex justify-between items-center bg-lux-surface/30 px-2.5 py-1.5 rounded">
                       <span className="text-lux-muted text-[10px] font-medium">Teléfono</span>
                       <span className="text-white font-medium text-[11px]">{user.phone || 'N/A'}</span>
                     </div>
                     <div className="flex justify-between items-center bg-lux-surface/30 px-2.5 py-1.5 rounded">
                       <span className="text-lux-muted text-[10px] font-medium">País</span>
                       <span className="text-white font-medium text-[11px]">{user.country || 'N/A'}</span>
                     </div>
                  </div>
                </div>

                {/* 2. Ecosistema Financiero */}
                <div className="bg-lux-bg p-4 rounded-xl border border-lux-hover/30 flex flex-col justify-between group hover:border-lux-hover/70 transition-colors">
                  <div className="flex items-center gap-2 mb-3 border-b border-lux-hover/20 pb-2">
                    <div className="w-6 h-6 rounded-md bg-lux-surface flex items-center justify-center border border-lux-hover/50 text-lux-sec text-[10px] uppercase font-bold">Fi</div>
                    <h3 className="text-lux-sec text-[10px] uppercase tracking-widest font-bold">Ecosistema</h3>
                  </div>
                  <div className="flex gap-2 h-full">
                    <div className="flex-1 flex flex-col items-center justify-center bg-lux-surface border border-lux-hover/30 rounded-lg p-2 shadow-inner">
                       <span className="text-lux-muted text-[9px] uppercase tracking-wider font-bold mb-1">Cuentas</span>
                       <span className="text-white text-xl font-bold">{user.accounts ?? 0}</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center bg-lux-surface border border-lux-hover/30 rounded-lg p-2 shadow-inner">
                       <span className="text-lux-muted text-[9px] uppercase tracking-wider font-bold mb-1">Categorías</span>
                       <span className="text-white text-xl font-bold">{user.categories ?? 0}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Transacciones (D/S/M) */}
                <div className="bg-lux-bg p-4 rounded-xl border border-lux-gold/20 flex flex-col justify-between shadow-[0_0_15px_rgba(212,175,55,0.03)] group hover:border-lux-gold/40 transition-colors">
                  <div className="flex items-center gap-2 mb-3 border-b border-lux-gold/10 pb-2">
                    <div className="w-6 h-6 rounded-md bg-lux-gold/10 flex items-center justify-center border border-lux-gold/20 text-lux-gold text-xs">tx</div>
                    <h3 className="text-lux-gold text-[10px] uppercase tracking-widest font-bold drop-shadow-sm">Flujo Transaccional</h3>
                  </div>
                  <div className="flex flex-col justify-center gap-2.5 h-full pb-1">
                    {/* Fila superior: Diarias y Semanal */}
                    <div className="flex gap-2.5 w-full">
                       <div className="flex-1 bg-lux-surface/40 border border-lux-hover/50 rounded-lg py-2 flex flex-col items-center justify-center shadow-inner">
                          <span className="text-lux-muted text-[9px] font-bold uppercase tracking-wider mb-0.5">Diarias</span>
                          <span className="text-white font-bold text-[15px]">{user.daily_trans || 0}</span>
                       </div>
                       <div className="flex-1 bg-lux-surface/40 border border-lux-hover/50 rounded-lg py-2 flex flex-col items-center justify-center shadow-inner">
                          <span className="text-lux-muted text-[9px] font-bold uppercase tracking-wider mb-0.5">Semanal</span>
                          <span className="text-white font-bold text-[15px]">{user.week_trans || 0}</span>
                       </div>
                    </div>
                    {/* Fila inferior destacada: Mensual */}
                    <div className="w-full bg-lux-gold/5 border border-lux-gold/30 rounded-lg py-2.5 flex flex-col items-center justify-center relative overflow-hidden group-hover:bg-lux-gold/10 transition-colors shadow-[inset_0_0_12px_rgba(212,175,55,0.05)]">
                       <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-lux-gold/40 to-transparent"></div>
                       <span className="text-lux-gold text-[9px] font-bold uppercase tracking-widest mb-0.5 relative z-10">Mensual</span>
                       <span className="text-lux-gold font-black text-2xl drop-shadow-[0_0_10px_rgba(212,175,55,0.3)] relative z-10 leading-none">{user.monthly_trans || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico de Transacciones pasadas */}
              <div className="w-full flex-shrink-0 lg:flex-shrink lg:flex-1 h-[250px] lg:h-auto overflow-hidden border border-lux-hover/40 rounded-xl bg-lux-surface shadow-inner relative mt-2 lg:mt-0">
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
            <div className="w-full lg:w-[380px] h-[400px] lg:h-full border border-lux-hover/40 rounded-xl bg-lux-surface flex flex-col shadow-inner overflow-hidden shrink-0">
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
