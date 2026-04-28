/*
Este archivo provee el componente de error estándar para páginas del CRM.
Muestra un bloque de error uniforme cuando falla la carga de un módulo.

Funciones exportadas:
- PageError: renderiza un mensaje de error con título y detalle en el estilo visual del CRM.
*/

type PageErrorProps = {
  title: string;
  message: string;
};

export default function PageError({ title, message }: PageErrorProps) {
  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-6 py-5 text-red-100 shadow-xl">
      <h2 className="text-base font-semibold mb-1">{title}</h2>
      <p className="text-sm text-red-200">{message}</p>
    </div>
  );
}
