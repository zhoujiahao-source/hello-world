import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client.js";
import type { Run } from "../../api/types.js";

const STATUS_COLOR: Record<string, string> = {
  completed: "text-green-400",
  failed: "text-red-400",
  running: "text-yellow-400",
  pending: "text-gray-400",
  cancelled: "text-gray-500",
};

export function RecentRuns() {
  const { data, isLoading } = useQuery({
    queryKey: ["runs-recent"],
    queryFn: () => api.get<Run[]>("/runs/recent?limit=10"),
    refetchInterval: 5000,
  });

  if (isLoading) return <div className="text-gray-600 text-xs">Loading…</div>;
  if (!data?.length) return <div className="text-gray-600 text-xs">No recent runs</div>;

  return (
    <div className="space-y-2">
      {data.map((run) => (
        <div key={run.id} className="bg-gray-900 border border-gray-800 rounded p-3 flex items-center gap-3">
          <span className={`text-xs font-medium ${STATUS_COLOR[run.status] ?? "text-gray-400"}`}>
            {run.status}
          </span>
          <span className="text-xs text-gray-500 uppercase">{run.engineKind}</span>
          <span className="text-xs text-gray-300 flex-1 truncate">{run.prompt}</span>
          <span className="text-xs text-gray-600">{new Date(run.createdAt).toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  );
}
