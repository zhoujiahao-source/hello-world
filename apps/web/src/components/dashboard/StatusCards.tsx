import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client.js";
import type { Engine, Run, RuntimeInfoResponse, HealthResponse } from "../../api/types.js";

export function StatusCards() {
  const enginesQ = useQuery({ queryKey: ["engines"], queryFn: () => api.get<Engine[]>("/engines") });
  const runsQ = useQuery({ queryKey: ["runs-recent"], queryFn: () => api.get<Run[]>("/runs/recent?limit=5") });
  const runtimeQ = useQuery({ queryKey: ["runtime-info"], queryFn: () => api.get<RuntimeInfoResponse>("/runtime-info") });
  const healthQ = useQuery({ queryKey: ["health"], queryFn: () => api.get<HealthResponse>("/health") });

  const healthy = enginesQ.data?.filter((e) => e.health === "healthy").length ?? 0;
  const total = enginesQ.data?.length ?? 0;
  const running = runsQ.data?.filter((r) => r.status === "running").length ?? 0;
  const runtime = runtimeQ.data?.runtime;
  const limitations = healthQ.data?.limitations ?? [];
  const manifestValid = healthQ.data?.manifest?.valid ?? false;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {[
        { label: "Engines healthy", value: `${healthy}/${total}` },
        { label: "Runs active", value: running },
        { label: "Total engines", value: total },
        { label: "Recent runs", value: runsQ.data?.length ?? 0 },
        { label: "Runtime mode", value: runtime?.mode ?? "-" },
      ].map((card) => (
        <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-300">{card.value}</div>
          <div className="text-xs text-gray-500 mt-1">{card.label}</div>
        </div>
      ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-xs text-gray-300 space-y-1">
          <div>Bundle target: <span className="text-blue-300">{runtime?.target ?? "-"}</span></div>
          <div>Bundled Node: <span className={runtime?.bundledNodePath ? "text-green-400" : "text-yellow-400"}>{runtime?.bundledNodePath ?? "not found"}</span></div>
          <div className="truncate">portable-data: {runtime?.dataDir ?? "-"}</div>
          <div>Manifest: <span className={manifestValid ? "text-green-400" : "text-yellow-400"}>{manifestValid ? "valid" : "missing/incomplete"}</span></div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-xs text-gray-300 space-y-1">
          <div className="font-semibold text-gray-400">Known limitations</div>
          {limitations.length ? limitations.map((item) => (
            <div key={item} className="text-yellow-300">{item}</div>
          )) : <div className="text-gray-500">No limitations reported</div>}
          {limitations.some((x) => x.toLowerCase().includes("native")) && (
            <div className="text-orange-300">Native module limits here are build-environment restrictions, not architecture defects.</div>
          )}
        </div>
      </div>
    </div>
  );
}
