/*
Este archivo actúa como componente servidor (Server Component) que envuelve al Sidebar de cliente.
Consulta el contexto de autenticación para determinar si el usuario es administrador antes de 
renderizar y enviar el componente al cliente, protegiendo así la visibilidad de la navegación lateral.

Elementos externos:
- getOptionalAuthContext: función que provee el contexto de autenticación y si el usuario es administrador.
- Sidebar: Componente cliente de React que renderiza la navegación interactiva.

Funciones exportadas:
- SidebarWrapper: Renderiza asincrónicamente el componente de navegación lateral si el usuario es administrador.
*/
import { getOptionalAuthContext } from "@/app/lib/auth";
import Sidebar from "./Sidebar";

export default async function SidebarWrapper() {
  const authContext = await getOptionalAuthContext();
  const isAdmin = authContext?.isAdmin ?? false;

  if (!isAdmin) return null;

  return <Sidebar />;
}
