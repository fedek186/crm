"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface Props {
  title: string;
  column: string;
}

export default function SortableHeader({ title, column }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get("sort");
  const currentDir = searchParams.get("dir") || "desc"; // Default desc, como pediste

  const isCurrentSort = currentSort === column;
  const newDir = isCurrentSort && currentDir === "desc" ? "asc" : "desc";

  const handleSort = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", column);
    params.set("dir", newDir);

    startTransition(() => {
      router.push(`/?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <th className="px-6 py-4">
      <button 
        onClick={handleSort}
        disabled={isPending}
        className={`flex items-center gap-2 cursor-pointer select-none transition-colors hover:text-white ${isPending ? 'opacity-50' : ''}`}
      >
        {title}
        <span className={`text-[9px] ${isCurrentSort ? 'text-lux-gold' : 'text-lux-muted'}`}>
          {isCurrentSort ? (newDir === "desc" ? "▼" : "▲") : "▼"}
        </span>
        {isPending && <span className="w-3 h-3 border-2 border-lux-gold border-t-transparent rounded-full animate-spin"></span>}
      </button>
    </th>
  );
}
