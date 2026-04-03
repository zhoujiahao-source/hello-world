import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client.js";
import type { Engine, EngineDiagnostic } from "../api/types.js";

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

export function useEngineDiagnostics() {
  return useQuery({
    queryKey: ["engines-diagnostics"],
    queryFn: () => api.get<EngineDiagnostic[]>("/engines/diagnostics"),
  });
}

export function useValidateEngine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (kind: string) => api.post<{ valid: boolean; message: string | null }>(`/engines/${kind}/validate`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["engines-diagnostics"] });
      void qc.invalidateQueries({ queryKey: ["engines"] });
    },
  });
}

export function useSetEnginePath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, path }: { kind: string; path: string }) =>
      api.put<{ kind: string; overridePath: string | null }>(`/engines/${kind}/path`, { path }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["engines-diagnostics"] });
      void qc.invalidateQueries({ queryKey: ["engines"] });
    },
  });
}

export function useClearEnginePath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (kind: string) => api.delete<{ kind: string; overridePath: string | null }>(`/engines/${kind}/path`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["engines-diagnostics"] });
      void qc.invalidateQueries({ queryKey: ["engines"] });
    },
  });
}

export function useResetEngineBundled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (kind: string) => api.post<{ kind: string; source: string; command: string }>(`/engines/${kind}/reset-bundled`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["engines-diagnostics"] });
      void qc.invalidateQueries({ queryKey: ["engines"] });
    },
  });
}
