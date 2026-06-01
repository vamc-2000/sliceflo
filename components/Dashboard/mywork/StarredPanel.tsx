
"use client";

import { useMemo, useEffect } from "react";
import { Star, ChevronRight } from "lucide-react";
import { useFavoritesStore } from "@/stores/favorites-store";

export function StarredPanel() {
  const { favorites, fetchFavorites } = useFavoritesStore();

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
        <h3 className="text-sm font-bold">Favorites</h3>
      </div>
      <div className="flex flex-col gap-1.5">
        {favorites.map((item) => (
          <div
            key={item.id}
            className="group flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-border cursor-pointer"
          >
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate group-hover:text-blue-600 transition-colors">
                {item.name}
              </span>
              <span className="text-[10px] text-muted-foreground truncate capitalize">
                {item.type || "Page"}
              </span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
        {favorites.length === 0 && (
          <p className="text-[10px] text-muted-foreground px-2">No favorites yet.</p>
        )}
      </div>
    </div>
  );
}
