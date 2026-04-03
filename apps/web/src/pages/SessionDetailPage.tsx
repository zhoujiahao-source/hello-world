import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSession, useSessionRuns, useMessages } from "../hooks/useSessionRuns.js";
import { MessageComposer } from "../components/sessions/MessageComposer.js";
import { Timeline } from "../components/sessions/Timeline.js";
import { RunOutputPanel } from "../components/sessions/RunOutputPanel.js";
import { Loading } from "../components/common/Loading.js";
import { api } from "../api/client.js";
import type { RunDiffResponse } from "../api/types.js";

export function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading } = useSession(id!);
  const { data: runs } = useSessionRuns(id!);
  const { data: messages } = useMessages(id!);
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>();

  const selectedRun = runs?.find((r) => r.id === selectedRunId) ?? runs?.[0];
  const { data: runDiff } = useQuery({
    queryKey: ["run-diff", selectedRun?.id],
    queryFn: () => api.get<RunDiffResponse>(`/runs/${selectedRun?.id}/diff`),
    enabled: !!selectedRun?.id,
    refetchInterval: selectedRun?.status === "running" ? 2000 : false,
  });

  if (isLoading) return <Loading />;
  if (!session) return <div className="text-red-400">Session not found</div>;

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-100">
          {session.title ?? `Session ${session.id.slice(0, 8)}`}
        </h1>
        <div className="flex gap-3 items-center">
          <span className="text-xs text-gray-500 uppercase">{session.engineKind}</span>
          <span className={`text-xs ${session.status === "running" ? "text-yellow-400" : "text-gray-500"}`}>
            {session.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 flex-1 min-h-0">
        <div className="col-span-1 space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase">Runs</h2>
          <div className="overflow-y-auto max-h-96 scrollbar-thin">
            <Timeline
              runs={runs ?? []}
              selectedRunId={selectedRun?.id}
              onSelect={setSelectedRunId}
            />
          </div>
        </div>

        <div className="col-span-2 space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase">Output</h2>
          {selectedRun ? (
            <RunOutputPanel run={selectedRun} />
          ) : (
            <div className="text-xs text-gray-600">No run selected</div>
          )}
        </div>

        <div className="col-span-1 space-y-3 min-h-0">
          <h2 className="text-xs font-semibold text-gray-500 uppercase">Diff</h2>
          <div className="text-xs">
            source:{" "}
            <span className={
              runDiff?.source === "git-native"
                ? "text-green-400"
                : runDiff?.source === "internal-diff"
                ? "text-yellow-400"
                : "text-gray-500"
            }>
              {runDiff?.source ?? "unavailable"}
            </span>
          </div>
          {runDiff?.summary && (
            <div className="text-xs text-gray-400 space-y-1">
              <div>+ added: {runDiff.summary.addedFiles.length}</div>
              <div>~ modified: {runDiff.summary.modifiedFiles.length}</div>
              <div>- deleted: {runDiff.summary.deletedFiles.length}</div>
              {runDiff.summary.warnings.map((w) => (
                <div key={w} className="text-yellow-400">{w}</div>
              ))}
            </div>
          )}
          <div className="bg-gray-950 rounded border border-gray-800 p-2 h-64 overflow-y-auto text-[11px] font-mono whitespace-pre-wrap break-words">
            {runDiff?.patch || "No diff patch"}
          </div>
        </div>
      </div>

      <MessageComposer sessionId={id!} engineKind={session.engineKind} />
    </div>
  );
}
