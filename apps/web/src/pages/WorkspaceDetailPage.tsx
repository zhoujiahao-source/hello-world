import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client.js";
import type { Workspace, Session } from "../api/types.js";
import { Loading } from "../components/common/Loading.js";
import { ENGINE_KINDS } from "@usb-ai-workbench/shared";
import { Link } from "react-router-dom";
import { JsonView } from "../components/common/JsonView.js";

interface WorkspaceDiff {
  provider: "git" | "internal";
  diff: string;
  files: string[];
  truncated: boolean;
  warnings: string[];
}

export function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [engineKind, setEngineKind] = useState<string>("claude");

  const { data: workspace, isLoading } = useQuery({
    queryKey: ["workspace", id],
    queryFn: () => api.get<Workspace>(`/workspaces/${id}`),
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions", id],
    queryFn: () => api.get<Session[]>(`/sessions?workspaceId=${id}`),
  });
  const { data: diffInfo, refetch: refetchDiff } = useQuery({
    queryKey: ["workspace-diff", id],
    queryFn: () => api.get<WorkspaceDiff>(`/workspaces/${id}/diff`),
    enabled: !!id,
  });

  const createSession = useMutation({
    mutationFn: () => api.post<Session>("/sessions", { workspaceId: id, engineKind }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["sessions", id] }),
  });

  if (isLoading) return <Loading />;
  if (!workspace) return <div className="text-red-400">Workspace not found</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-100">{workspace.name}</h1>
        {workspace.description && <p className="text-gray-500 text-sm mt-1">{workspace.description}</p>}
        <p className="text-xs text-gray-600 font-mono mt-1">{workspace.path}</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">New Session</h2>
        <div className="flex gap-3">
          <select value={engineKind} onChange={(e) => setEngineKind(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500">
            {ENGINE_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <button onClick={() => createSession.mutate()} disabled={createSession.isPending}
            className="px-4 py-1.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-sm rounded transition-colors">
            {createSession.isPending ? "…" : "Start Session"}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Sessions</h2>
        <div className="space-y-2">
          {(sessions ?? []).map((s) => (
            <Link key={s.id} to={`/sessions/${s.id}`}
              className="block bg-gray-900 border border-gray-800 rounded p-3 hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">{s.title ?? `Session ${s.id.slice(0, 8)}`}</span>
                <span className="text-xs text-gray-500 uppercase">{s.engineKind}</span>
              </div>
              <span className={`text-xs ${s.status === "running" ? "text-yellow-400" : "text-gray-600"}`}>{s.status}</span>
            </Link>
          ))}
          {!sessions?.length && <p className="text-gray-600 text-xs">No sessions yet</p>}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400">Workspace Diff</h2>
          <button
            onClick={() => void refetchDiff()}
            className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded"
          >
            Refresh diff
          </button>
        </div>
        <div className="text-xs text-gray-500">provider: {diffInfo?.provider ?? "-"}</div>
        {diffInfo?.warnings?.map((w) => (
          <div key={w} className="text-xs text-yellow-400">{w}</div>
        ))}
        <JsonView data={{ files: diffInfo?.files ?? [], truncated: diffInfo?.truncated ?? false }} maxHeight="120px" />
        <pre className="bg-gray-950 border border-gray-800 rounded p-3 text-xs text-gray-300 overflow-auto max-h-[320px]">
          {diffInfo?.diff ?? "No diff available"}
        </pre>
      </div>
    </div>
  );
}
