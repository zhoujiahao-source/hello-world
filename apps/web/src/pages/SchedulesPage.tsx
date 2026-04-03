import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client.js";
import type { Schedule, Workspace } from "../api/types.js";
import { ScheduleList } from "../components/schedules/ScheduleList.js";
import { ScheduleForm } from "../components/schedules/ScheduleForm.js";
import { Loading } from "../components/common/Loading.js";
import { EmptyState } from "../components/common/EmptyState.js";

export function SchedulesPage() {
  const [showForm, setShowForm] = useState(false);
  const [wsId, setWsId] = useState<string>("");

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["schedules"],
    queryFn: () => api.get<Schedule[]>("/schedules"),
    refetchInterval: 10000,
  });

  const { data: workspaces } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api.get<Workspace[]>("/workspaces"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-100">Schedules</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded transition-colors">
          {showForm ? "Cancel" : "+ New Schedule"}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <select value={wsId} onChange={(e) => setWsId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
            <option value="">Select workspace…</option>
            {(workspaces ?? []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          {wsId && <ScheduleForm workspaceId={wsId} onSuccess={() => setShowForm(false)} />}
        </div>
      )}

      {isLoading ? <Loading /> : !schedules?.length ? (
        <EmptyState title="No schedules" description="Create a schedule to automate prompts." />
      ) : (
        <ScheduleList schedules={schedules} />
      )}
    </div>
  );
}
