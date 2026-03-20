"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";

export default function SearchTableInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [term, setTerm] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();

  // Escuchamos el cambio de "term" que hace el usuario, sin atarlo al router infinitamente
  useEffect(() => {
    // Si el término que está en el state es igual al de la URL, no hacemos push
    if (term === (searchParams.get("search") || "")) return;

    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (term) {
        params.set("search", term);
        params.delete("page");
      } else {
        params.delete("search");
      }
      
      startTransition(() => {
        router.push(`/?${params.toString()}`, { scroll: false });
      });
    }, 400);

    return () => clearTimeout(handler);
  }, [term, searchParams, router]);

  return (
    <div className="relative w-full max-w-sm">
      <input 
        type="text" 
        placeholder="Buscar cliente, email..." 
        className="w-full bg-lux-surface border border-lux-hover text-white px-4 py-2.5 rounded-md focus:outline-none focus:border-lux-gold focus:ring-1 focus:ring-lux-gold transition-all shadow-inner placeholder:text-lux-muted text-sm font-light" 
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      {isPending && (
        <span className="w-4 h-4 border-2 border-lux-gold border-t-transparent rounded-full animate-spin absolute right-3 top-3 opacity-70"></span>
      )}
    </div>
  );
}
