"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export default function Pagination({ totalPages }: { totalPages: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentPage = Number(searchParams.get("page")) || 1;

  if (totalPages <= 1) return null; // No mostrar paginador si solo hay una página

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    
    startTransition(() => {
      router.push(`/?${params.toString()}`, { scroll: false }); // scroll false evita que brinque top de golpe
    });
  };

  return (
    <div className="flex justify-center items-center gap-3 w-full pt-4">
      <button 
        className="px-4 py-2 bg-lux-surface border border-lux-hover text-lux-text rounded-md hover:bg-lux-hover/80 hover:border-lux-sec transition-all disabled:opacity-30 disabled:cursor-not-allowed font-medium text-xs tracking-wider uppercase" 
        onClick={() => handlePageChange(currentPage - 1)} 
        disabled={currentPage <= 1 || isPending}
      >
        Ant.
      </button>
      <div className="px-5 py-2 bg-[#1a1a19] border border-lux-hover/50 rounded-md text-lux-sec text-[13px] flex items-center justify-center gap-2 min-w-[140px]">
        {isPending ? <span className="w-4 h-4 border-2 border-lux-gold border-t-transparent rounded-full animate-spin"></span> : <span>Pág <span className="text-white font-medium">{currentPage}</span> / {totalPages}</span>}
      </div>
      <button 
        className="px-4 py-2 bg-lux-surface border border-lux-hover text-lux-text rounded-md hover:bg-lux-hover/80 hover:border-lux-sec transition-all disabled:opacity-30 disabled:cursor-not-allowed font-medium text-xs tracking-wider uppercase" 
        onClick={() => handlePageChange(currentPage + 1)} 
        disabled={currentPage >= totalPages || isPending}
      >
        Sig.
      </button>
    </div>
  );
}
