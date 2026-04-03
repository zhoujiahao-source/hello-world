import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client.js";
import type { Engine, Run } from "../../api/types.js";

export function StatusCards() {
  const enginesQ = useQuery({ queryKey: ["engines"], queryFn: () => api.get<Engine[]>("/engines") });
  const runsQ = useQuery({ queryKey: ["runs-recent"], queryFn: () => api.get<Run[]>("/runs/recent?limit=5") });

  const healthy = enginesQ.data?.filter((e) => e.health === "healthy").length ?? 0;
  const total = enginesQ.data?.length ?? 0;
  const running = runsQ.data?.filter((r) => r.status === "running").length ?? 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: "Engines healthy", value: `${healthy}/${total}` },
        { label: "Runs active", value: running },
        { label: "Total engines", value: total },
        { label: "Recent runs", value: runsQ.data?.length ?? 0 },
      ].map((card) => (
        <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-300">{card.value}</div>
          <div className="text-xs text-gray-500 mt-1">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
