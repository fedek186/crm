/*
Este archivo renderiza un estado de carga global para la aplicación de Next.js.
Provee una retroalimentación visual inmediata al usuario cuando navega entre páginas,
permitiendo que la interfaz responda al instante mientras los componentes del servidor
descargan datos de forma asíncrona, evitando que la app parezca "congelada".

Elementos externos:
- Ninguno: utiliza etiquetas HTML estándar con clases de Tailwind CSS y DaisyUI nativas de la aplicación.

Funciones exportadas:
- Loading: renderiza un spinner de carga centrado en la pantalla con los estilos del proyecto.
*/

export default function Loading() {
  return (
    <div className="min-h-screen bg-lux-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="loading loading-spinner text-lux-gold loading-lg"></span>
        <p className="text-lux-sec text-sm font-medium animate-pulse">Cargando...</p>
      </div>
    </div>
  );
}
