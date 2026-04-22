
import dynamic from "next/dynamic";


export default async function FeaturesPage() {

  return (
    <div className="min-h-screen bg-lux-bg px-6 py-10">
      <div className="mx-auto max-w-[1400px] space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-sm">
            Features
          </h1>
          <p className="text-lux-sec text-sm">
            Analizá el uso de funcionalidades del producto por usuarios y volumen de transacciones.
          </p>
        </div>
      </div>
    </div>
  );
}
