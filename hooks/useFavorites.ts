import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { Quote } from "@/data/quotes";
import { getFavorites, toggleLike } from "@/lib/quote-storage";

export function useFavorites() {
  const queryClient = useQueryClient();
  const query = useQuery<Quote[]>({
    queryKey: ["favorites"],
    queryFn: getFavorites,
  });

  const likeMutation = useMutation({
    mutationFn: toggleLike,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });

  const toggleFavorite = useCallback(
    (id: string) => likeMutation.mutate(id),
    [likeMutation]
  );

  const ids = new Set((query.data ?? []).map((q) => String(q.id)));
  const isFavorite = useCallback((id: string) => ids.has(String(id)), [ids]);

  return {
    favorites: query.data ?? [],
    isLoading: query.isLoading,
    toggleFavorite,
    isFavorite,
    refetch: query.refetch,
  };
}