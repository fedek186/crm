/*
Este archivo provee el encabezado estándar para las páginas del CRM.
Unifica el estilo de título, subtítulo y slot derecho (búsqueda, botones) en toda la aplicación.

Funciones exportadas:
- PageHeader: renderiza el título, subtítulo opcional, contador opcional y un slot derecho opcional.
*/

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  count?: string;
  right?: React.ReactNode;
};

export default function PageHeader({ title, subtitle, count, right }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-sm">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm font-normal text-lux-muted max-w-2xl">{subtitle}</p>
        )}
              </div>
      {right && (
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {right}
        </div>
      )}
    </div>
  );
}
