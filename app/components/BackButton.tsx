"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button 
      onClick={() => router.back()} 
      className="p-2 mr-4 bg-lux-bg rounded-lg border border-lux-hover/40 hover:bg-lux-hover/30 transition-colors shadow-sm focus:outline-none focus:ring-1 focus:ring-lux-gold/50 text-white flex items-center justify-center shrink-0"
      aria-label="Volver atrás"
      title="Volver atrás"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-lux-gold">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
      </svg>
    </button>
  );
}
