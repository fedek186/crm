/*
Este archivo define el diseño principal (RootLayout) de la aplicación, envolviendo
todas las páginas. Configura el HTML base, provee los estilos globales e incluye
el componente Header con un límite de Suspense para optimizar el renderizado inicial y streaming HTML.

Elementos externos:
- Metadata: tipo de Next.js para definir los metadatos base de la aplicación.
- Suspense: componente de React que muestra un fallback mientras los componentes hijos cargan de forma asíncrona.
- Header: cabecera principal de navegación de la aplicación.

Funciones exportadas:
- RootLayout: renderiza la estructura principal de la aplicación, el encabezado envuelto en Suspense y las páginas anidadas.
*/
import type { Metadata } from "next";
import { Suspense } from "react";
import "./styles/globals.css";
import Header from "./components/Header";
import SidebarWrapper from "./components/SidebarWrapper";

export const metadata: Metadata = {
  title: "Piggy Admin",
  description: "Panel administrativo de Piggy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-theme="piggy" lang="en">
      <body className="antialiased h-screen bg-lux-bg text-lux-text overflow-hidden">
        <div className="drawer lg:drawer-open h-full">
          <input id="mobile-sidebar" type="checkbox" className="drawer-toggle" />
          
          <div className="drawer-content flex flex-col h-full overflow-hidden min-w-0 relative">
            <Suspense fallback={<div className="h-[73px] flex items-center px-6 md:px-12 bg-lux-bg border-b border-lux-hover/40"><span className="text-white font-bold text-xl tracking-tight">Piggy <span className="text-lux-gold">Admin</span></span></div>}>
              <Header />
            </Suspense>
            <main className="flex-1 overflow-x-hidden overflow-y-auto min-h-0 bg-lux-bg">
              {children}
            </main>
          </div>
          
          <div className="drawer-side z-[70]">
            <label htmlFor="mobile-sidebar" aria-label="close sidebar" className="drawer-overlay"></label>
            <Suspense fallback={<div className="w-64 bg-lux-surface border-r border-lux-hover/40 flex-shrink-0 h-full" />}>
              <SidebarWrapper />
            </Suspense>
          </div>
        </div>
      </body>
    </html>
  );
}
