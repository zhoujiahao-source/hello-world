import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client.js";
import type { Schedule } from "../../api/types.js";

interface Props {
  schedules: Schedule[];
}

export function ScheduleList({ schedules }: Props) {
  const qc = useQueryClient();
  const toggle = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/schedules/${id}/status`, { status }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["schedules"] }),
  });
  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/schedules/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["schedules"] }),
  });

  return (
    <div className="space-y-2">
      {schedules.map((s) => (
        <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-100 font-medium text-sm">{s.title}</span>
            <div className="flex gap-2 items-center">
              <span className={`text-xs px-2 py-0.5 rounded border ${s.status === "active" ? "text-green-300 border-green-700" : "text-gray-500 border-gray-700"}`}>
                {s.status}
              </span>
              <button
                onClick={() => toggle.mutate({ id: s.id, status: s.status === "active" ? "paused" : "active" })}
                className="text-xs text-blue-400 hover:text-blue-200"
              >
                {s.status === "active" ? "Pause" : "Resume"}
              </button>
              <button onClick={() => del.mutate(s.id)} className="text-xs text-red-400 hover:text-red-200">
                Delete
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-500 space-x-3">
            <span className="font-mono">{s.cronExpr}</span>
            <span className="uppercase">{s.engineKind}</span>
            {s.lastRunAt && <span>last: {new Date(s.lastRunAt).toLocaleString()}</span>}
          </div>
          <p className="text-xs text-gray-600 mt-1 truncate">{s.prompt}</p>
        </div>
      ))}
    </div>
  );
}
