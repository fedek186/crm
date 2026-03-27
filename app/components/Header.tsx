/*
Este archivo renderiza el componente Header, que es la cabecera principal de la aplicación.
Provee la navegación global, mostrando enlaces a las páginas principales (Usuarios,
Transacciones, Merchants, Reportes y Ajustes) y maneja la visualización de estas
opciones dependiendo de si el usuario está autenticado como administrador o no.

Elementos externos:
- Link: componente de Next.js usado para la navegación optimizada entre páginas.
- signOut: server action para manejar el cierre de sesión del usuario.
- getOptionalAuthContext: función que provee el contexto de autenticación y si el usuario es administrador.

Funciones exportadas:
- Header: renderiza la barra de navegación que se muestra en la parte superior de la aplicación.
*/
import Link from "next/link";
import { signOut } from "@/app/actions/auth.actions";
import { getOptionalAuthContext } from "@/app/lib/auth";

export default async function Header() {
  const authContext = await getOptionalAuthContext();
  const isAdmin = authContext?.isAdmin ?? false;

  return (
    <div className="w-full bg-lux-bg border-b border-lux-hover/40 px-6 md:px-12 h-[73px] flex justify-between items-center sticky top-0 z-50">
        <div className="flex-1 lg:hidden">
            <Link href="/" className="text-white font-bold text-xl tracking-tight cursor-pointer">
              Piggy <span className="text-lux-gold">Admin</span>
            </Link>
        </div>
        <div className="flex-1 hidden lg:block"></div>
        <div className="flex-none flex items-center gap-6 text-sm font-medium text-lux-sec">
            {isAdmin ? (
              <>
                <a className="hover:text-lux-gold transition-colors cursor-pointer">Ajustes</a>
                <form action={signOut}>
                  <button className="hover:text-lux-gold transition-colors cursor-pointer" type="submit">
                    Cerrar sesión
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="hover:text-lux-gold transition-colors cursor-pointer">
                Login
              </Link>
            )}
        </div>
    </div>
  );
}
