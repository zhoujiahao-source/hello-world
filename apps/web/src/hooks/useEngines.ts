import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client.js";
import type { Engine } from "../api/types.js";

export function useEngines() {
  return useQuery({
    queryKey: ["engines"],
    queryFn: () => api.get<Engine[]>("/engines"),
  });
}

export function useDiscoverEngines() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<Engine[]>("/engines/discover"),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["engines"] }); },
  });
}
