"use client";

/*
Este archivo provee un hook reutilizable para buscar merchants con debounce y estado de carga.
Encapsula la lógica de búsqueda asíncrona con delay para evitar llamadas excesivas al servidor,
utilizada principalmente en modales de asignación de merchants a transacciones.

Funciones exportadas:
- useMerchantSearch: gestiona el estado de búsqueda, la lista de resultados y el indicador de carga.
*/

import { useEffect, useState, useTransition } from "react";
import { getMerchantOptionsAction } from "@/app/actions/transaction.actions";
import type { MerchantOption } from "@/app/lib/transaction";

const DEBOUNCE_MS = 250;

type UseMerchantSearchOptions = {
  enabled: boolean;
};

type UseMerchantSearchResult = {
  merchants: MerchantOption[];
  isLoading: boolean;
  isPending: boolean;
};

export function useMerchantSearch(
  search: string,
  { enabled }: UseMerchantSearchOptions
): UseMerchantSearchResult {
  const [merchants, setMerchants] = useState<MerchantOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!enabled) return;

    const handler = setTimeout(() => {
      setIsLoading(true);
      startTransition(async () => {
        const results = await getMerchantOptionsAction(search.trim());
        setMerchants(results);
        setIsLoading(false);
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(handler);
  }, [enabled, search]);

  return { merchants, isLoading, isPending };
}
