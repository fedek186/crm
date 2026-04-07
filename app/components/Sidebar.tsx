"use client";

/*
Este archivo renderiza el componente Sidebar interactivo usando el cliente (Client Component).
Permite navegar por las diferentes secciones del sistema (CRM y Backoffice) de manera
colapsable, mostrando iconos representativos y marcando la sección activa usando la
ruta actual (pathname).

Elementos externos:
- Link: componente de Next.js usado para la navegación optimizada entre páginas.
- usePathname: hook de Next.js para determinar la ruta activa y resaltar la navegación.

Funciones exportadas:
- Sidebar: renderiza el menú lateral que se muestra en el lado izquierdo de la aplicación.
*/
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);

const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);

const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
);
const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

const ContactIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const TransactionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
);

const StoreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
);

export default function Sidebar() {
  const [isMinimized, setIsMinimized] = useState(false);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeDrawerOnMobile = () => {
    const drawerInput = document.getElementById("mobile-sidebar") as HTMLInputElement | null;
    if (drawerInput && drawerInput.checked) {
      drawerInput.checked = false;
    }
  };

  const navGroups = [
        {
      title: "Dashboard",
      items: [
        { name: "Dashboard", href: "/", icon: <DashboardIcon /> },
      ]
    },

    {
      title: "CRM",
      items: [
        { name: "Usuarios", href: "/users", icon: <UsersIcon /> },
        { name: "Contactos", href: "/contacts", icon: <ContactIcon /> },
      ]
    },
    {
      title: "Backoffice",
      items: [
        { name: "Transacciones", href: "/transactions", icon: <TransactionIcon /> },
        { name: "Merchants", href: "/merchants", icon: <StoreIcon /> },
      ]
    }
  ];

  if (!mounted) {
    return (
      <div className="bg-lux-surface border-r border-lux-hover/40 h-full flex flex-col w-64 z-[60] flex-shrink-0">
        <div className="h-[73px] border-b border-lux-hover/40"></div>
      </div>
    );
  }

  return (
    <div className={`bg-lux-surface border-r border-lux-hover/40 h-full flex flex-col transition-all duration-300 z-[60] relative flex-shrink-0 ${isMinimized ? "w-20" : "w-64"}`}>
      <div className="flex items-center justify-between p-4 border-b border-lux-hover/40 h-[73px]">
        {/* Logo if expanded */}
        <div className={`overflow-hidden whitespace-nowrap transition-all duration-300 flex items-center ${isMinimized ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
          <Link href="/" className="text-white font-bold text-xl tracking-tight cursor-pointer">
            Piggy <span className="text-lux-gold">Admin</span>
          </Link>
        </div>
        
        <button 
          onClick={() => setIsMinimized(!isMinimized)}
          className={`hidden lg:flex p-2 rounded-lg bg-lux-hover/20 hover:bg-lux-hover/80 text-lux-sec hover:text-white transition-colors flex-shrink-0 ${isMinimized ? "mx-auto" : ""}`}
          title={isMinimized ? "Expandir menú" : "Minimizar menú"}
        >
          {isMinimized ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
      </div>

      <div className="flex-1 overflow-visible py-6 flex flex-col gap-8">
        {navGroups.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-2">
            {!isMinimized ? (
              <span className="px-6 text-[10px] font-bold uppercase tracking-wider text-lux-muted/70">
                {group.title}
              </span>
            ) : (
              <div className="mx-auto w-6 border-t border-lux-hover/30 mt-2 mb-1"></div>
            )}
            
            <ul className="menu w-full gap-1 px-3">
              {group.items.map((item) => {
                const isActive = item.href === "/" 
                  ? pathname === "/" 
                  : pathname?.startsWith(item.href);

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={closeDrawerOnMobile}
                      className={`relative flex items-center h-12 rounded-lg transition-all duration-200 group
                        ${isActive 
                           ? "bg-lux-gold/15 text-lux-gold font-medium active:bg-lux-gold/20" 
                           : "text-lux-sec hover:bg-lux-hover/50 hover:text-white"
                        }
                        ${isMinimized ? "justify-center p-0 lg:justify-center" : "px-4"}
                      `}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-lux-gold" : "text-lux-muted group-hover:text-lux-sec"}`}>
                        {item.icon}
                      </span>

                      {!isMinimized && (
                        <span className="ml-3 text-sm truncate">
                          {item.name}
                        </span>
                      )}

                      {/* Tooltip on right side when minimized via CSS */}
                      {isMinimized && (
                        <div className="absolute left-16 px-3 py-1.5 bg-lux-surface ring-1 ring-white/10 text-white text-xs font-medium rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[9999] shadow-xl pointer-events-none">
                          {item.name}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
