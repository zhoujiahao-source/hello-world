import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client.js";
import type { Run, Session, Message } from "../api/types.js";

export function useSessionRuns(sessionId: string) {
  return useQuery({
    queryKey: ["runs", sessionId],
    queryFn: () => api.get<Run[]>(`/sessions/${sessionId}/runs`),
    refetchInterval: 2000,
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ["session", id],
    queryFn: () => api.get<Session>(`/sessions/${id}`),
    refetchInterval: 3000,
  });
}

export function useMessages(sessionId: string) {
  return useQuery({
    queryKey: ["messages", sessionId],
    queryFn: () => api.get<Message[]>(`/sessions/${sessionId}/messages`),
    refetchInterval: 2000,
  });
}

export function useStartRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { sessionId: string; engineKind: string; prompt: string }) =>
      api.post<Run>("/runs", input),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ["runs", vars.sessionId] });
      void qc.invalidateQueries({ queryKey: ["messages", vars.sessionId] });
    },
  });
}
