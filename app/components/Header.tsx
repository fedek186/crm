export default function Header() {
  return (
    <div className="w-full bg-lux-bg border-b border-lux-hover/40 px-6 md:px-12 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex-1">
            <a className="text-white font-bold text-xl tracking-tight cursor-pointer">
              Finanzas<span className="text-lux-gold">APP</span>
            </a>
        </div>
        <div className="flex-none flex gap-6 text-sm font-medium text-lux-sec">
            <a className="hover:text-lux-gold transition-colors cursor-pointer">Dashboard</a>
            <a className="hover:text-lux-gold transition-colors cursor-pointer hidden sm:block">Reportes</a>
            <a className="hover:text-lux-gold transition-colors cursor-pointer">Ajustes</a>
        </div>
    </div>
  );
}