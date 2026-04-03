import type { Engine } from "../../api/types.js";
import { EngineStatusBadge } from "./EngineStatusBadge.js";

interface Props {
  engine: Engine;
}

export function EngineCard({ engine }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-100 uppercase text-xs tracking-widest">{engine.kind}</span>
        <EngineStatusBadge health={engine.health} />
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        {engine.version && <div>version: {engine.version}</div>}
        {engine.executablePath && <div className="truncate">path: {engine.executablePath}</div>}
        {engine.lastCheckedAt && <div>checked: {new Date(engine.lastCheckedAt).toLocaleString()}</div>}
        {!engine.enabled && <div className="text-orange-400">disabled</div>}
      </div>
    </div>
  );
}
