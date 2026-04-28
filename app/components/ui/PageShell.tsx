/*
Este archivo provee el contenedor base para todas las páginas del CRM.
Aplica el fondo, padding y ancho máximo estándar de manera uniforme.

Funciones exportadas:
- PageShell: wrapper que envuelve el contenido de cada página con el layout base del CRM.
*/

type PageShellProps = {
  children: React.ReactNode;
  wide?: boolean;
};

export default function PageShell({ children, wide = true }: PageShellProps) {
  return (
    <div className="min-h-screen bg-lux-bg text-lux-text px-6 md:px-12 py-8 selection:bg-lux-gold selection:text-lux-bg">
      <div className={`mx-auto ${wide ? "max-w-[1600px]" : "max-w-4xl"}`}>
        {children}
      </div>
    </div>
  );
}
