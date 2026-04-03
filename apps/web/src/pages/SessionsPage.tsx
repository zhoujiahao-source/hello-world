import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import type { Session } from "../api/types.js";
import { Loading } from "../components/common/Loading.js";
import { EmptyState } from "../components/common/EmptyState.js";

export function SessionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => api.get<Session[]>("/sessions"),
    refetchInterval: 5000,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-gray-100">Sessions</h1>
      {isLoading ? <Loading /> : !data?.length ? (
        <EmptyState title="No sessions" description="Create a workspace and start a session." />
      ) : (
        <div className="space-y-2">
          {data.map((s) => (
            <Link key={s.id} to={`/sessions/${s.id}`}
              className="block bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-gray-100">{s.title ?? `Session ${s.id.slice(0, 8)}`}</span>
                <span className="text-xs text-gray-500 uppercase">{s.engineKind}</span>
              </div>
              <div className="flex gap-4 mt-1">
                <span className={`text-xs ${s.status === "running" ? "text-yellow-400" : "text-gray-600"}`}>{s.status}</span>
                <span className="text-xs text-gray-600">{new Date(s.createdAt).toLocaleString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
