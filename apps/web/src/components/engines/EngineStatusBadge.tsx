import type { EngineHealth } from "@usb-ai-workbench/shared";

const COLOR: Record<string, string> = {
  healthy: "bg-green-900/40 text-green-300 border-green-700",
  degraded: "bg-yellow-900/40 text-yellow-300 border-yellow-700",
  unavailable: "bg-red-900/40 text-red-300 border-red-700",
  unknown: "bg-gray-800 text-gray-400 border-gray-700",
};

export function EngineStatusBadge({ health }: { health: EngineHealth }) {
  return (
    <span className={`px-2 py-0.5 text-xs rounded border ${COLOR[health] ?? COLOR.unknown}`}>
      {health}
    </span>
  );
}
