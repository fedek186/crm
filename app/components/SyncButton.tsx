"use client";

import { useFormStatus } from "react-dom";

export default function SyncButton({ lastSyncDate }: { lastSyncDate?: string }) {
  const { pending } = useFormStatus();

  return (
    <div 
      className="tooltip tooltip-bottom tooltip-primary w-full sm:w-auto before:!text-black before:!font-normal" 
      data-tip={lastSyncDate ? `Último run: ${lastSyncDate}` : ""}
    >
      <button
        type="submit"
        disabled={pending}
        aria-label={pending ? "Sincronizando" : "Sincronizar"}
        aria-busy={pending}
        className="w-full sm:w-auto bg-lux-gold text-lux-bg px-6 py-2.5 rounded-md font-medium hover:bg-[#d8be86] transition-all shadow-[0_0_15px_rgba(239,211,149,0.1)] hover:shadow-[0_0_20px_rgba(239,211,149,0.25)] disabled:cursor-wait disabled:opacity-90 flex min-w-[148px] items-center justify-center"
      >
      {pending ? (
        <span
          className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-lux-bg/35 border-t-lux-bg"
          aria-hidden="true"
        />
      ) : (
        "Sincronizar"
      )}
    </button>
    </div>
  );
}
