"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";

type SearchTableInputProps = {
  placeholder?: string;
  queryParam?: string;
};

export default function SearchTableInput({
  placeholder = "Buscar cliente, email...",
  queryParam = "search",
}: SearchTableInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get(queryParam) || "";
  const [term, setTerm] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setTerm(initialSearch);
  }, [initialSearch]);

  // Escuchamos el cambio de "term" que hace el usuario, sin atarlo al router infinitamente
  useEffect(() => {
    // Si el término que está en el state es igual al de la URL, no hacemos push
    if (term === (searchParams.get(queryParam) || "")) return;

    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (term) {
        params.set(queryParam, term);
        params.delete("page");
      } else {
        params.delete(queryParam);
      }
      
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }, 400);

    return () => clearTimeout(handler);
  }, [pathname, queryParam, router, searchParams, term]);

  return (
    <div className="relative w-full max-w-sm">
      <input 
        type="text" 
        placeholder={placeholder}
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
