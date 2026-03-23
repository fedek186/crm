import Link from "next/link";
import { signOut } from "@/app/actions/auth.actions";
import { getOptionalAuthContext } from "@/app/lib/auth";

export default async function Header() {
  const authContext = await getOptionalAuthContext();
  const isAdmin = authContext?.isAdmin ?? false;

  return (
    <div className="w-full bg-lux-bg border-b border-lux-hover/40 px-6 md:px-12 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex-1">
            <Link href="/" className="text-white font-bold text-xl tracking-tight cursor-pointer">
              Piggy <span className="text-lux-gold">Admin</span>
            </Link>
        </div>
        <div className="flex-none flex items-center gap-6 text-sm font-medium text-lux-sec">
            {isAdmin ? (
              <>
                <Link href="/" className="hover:text-lux-gold transition-colors cursor-pointer">Usuarios</Link>
                <Link href="/transactions" className="hover:text-lux-gold transition-colors cursor-pointer">Transacciones</Link>
                <Link href="/merchants" className="hover:text-lux-gold transition-colors cursor-pointer">Merchants</Link>
                <a className="hover:text-lux-gold transition-colors cursor-pointer hidden sm:block">Reportes</a>
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
