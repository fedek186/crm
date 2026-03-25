/*
Este archivo renderiza la página principal del tablero Kanban de contactos.
Protege el acceso para que solo entren administradores y obtiene la lista global 
de contactos desde la base de datos para inyectarla en el tablero interactivo.

Elementos externos:
- getOptionalAuthContext: valida que el usuario actual sea un administrador autenticado.
- prisma: cliente auto-generado para consultar la base Postgres.
- redirect: redirige al inicio de sesión si el usuario no tiene permisos.
- KanbanBoard: componente cliente principal que maneja la lógica visual del tablero.

Funciones exportadas:
- ContactsPage: renderiza la vista Server Component principal de la ruta /contacts.
*/
import { getOptionalAuthContext } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { redirect } from "next/navigation";
import KanbanBoard from "@/app/components/kanban/KanbanBoard";
import KanbanDateFilter from "@/app/components/kanban/KanbanDateFilter";

export default async function ContactsPage(props: { searchParams?: Promise<{ [key: string]: string | undefined }> }) {
  const authContext = await getOptionalAuthContext();
  if (!authContext?.isAdmin) return redirect("/login");

  const searchParams = (await props.searchParams) || {};
  const from = searchParams.from;
  const to = searchParams.to;

  const whereClause: any = {};
  if (from || to) {
    whereClause.start_date = {};
    if (from) {
      whereClause.start_date.gte = new Date(from);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      whereClause.start_date.lte = toDate;
    }
  }

  const contacts = await prisma.contacts.findMany({
    where: whereClause,
    include: {
      user: true,
    },
    orderBy: {
      start_date: 'asc'
    }
  });

  // Calculamos el número de cuenta de iteraciones por usuario
  const userCounts: Record<string, number> = {};
  const processedContacts = contacts.map(c => {
    const uid = c.user_id || 'unknown';
    userCounts[uid] = (userCounts[uid] || 0) + 1;
    return { ...c, numero: userCounts[uid] };
  });

  // Re-ordenamos por el índice del tablero para pasarlo a KanbanBoard
  processedContacts.sort((a, b) => (a.board_order || 0) - (b.board_order || 0));

  return (
    <div className="min-h-screen bg-lux-bg flex flex-col">
      <div className="px-6 md:px-12 py-8 flex-1 flex flex-col items-start w-full">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
          Tablero de <span className="text-lux-gold">Contactos</span>
        </h1>
        <p className="text-lux-muted text-sm mb-6">
          Gestiona y ordena los estados de interacción con los usuarios libremente.
        </p>
        
        <KanbanDateFilter />

        {/* Client component para manejar el Drag and Drop */}
        <div className="w-full">
           <KanbanBoard initialContacts={processedContacts as any} />
        </div>
      </div>
    </div>
  );
}
