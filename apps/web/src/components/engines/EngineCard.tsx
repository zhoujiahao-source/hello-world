import type { Engine, EngineDiagnostic } from "../../api/types.js";
import { EngineStatusBadge } from "./EngineStatusBadge.js";
import { useState } from "react";
import {
  useClearEnginePath,
  useResetEngineBundled,
  useSetEnginePath,
  useValidateEngine,
} from "../../hooks/useEngines.js";
import { JsonView } from "../common/JsonView.js";

interface Props {
  engine: Engine;
  diagnostic?: EngineDiagnostic;
}

export function EngineCard({ engine, diagnostic }: Props) {
  const [customPath, setCustomPath] = useState(diagnostic?.overridePath ?? "");
  const [showDetail, setShowDetail] = useState(false);
  const validate = useValidateEngine();
  const setPath = useSetEnginePath();
  const clearPath = useClearEnginePath();
  const resetBundled = useResetEngineBundled();
  const source = diagnostic?.source ?? "not-found";

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-100 uppercase text-xs tracking-widest">{engine.kind}</span>
        <EngineStatusBadge health={engine.health} />
      </div>
      <div className="text-xs text-gray-500 space-y-1">
        <div>source: <span className="text-gray-300">{source}</span></div>
        <div className="truncate">binary: {diagnostic?.command ?? engine.executablePath ?? "-"}</div>
        <div className="truncate">bundled: {diagnostic?.bundledPath ?? "-"}</div>
        {engine.version && <div>version: {engine.version}</div>}
        {diagnostic?.status?.version && <div>detected: {diagnostic.status.version}</div>}
        <div>PATH fallback: {diagnostic?.pathFallbackAllowed ? "allowed" : "disabled"}</div>
        <div>override: {diagnostic?.overridePath ? "yes" : "no"}</div>
        {diagnostic?.validation && (
          <div className={diagnostic.validation.valid ? "text-green-400" : "text-orange-400"}>
            validation: {diagnostic.validation.valid ? "ok" : diagnostic.validation.message ?? "failed"}
          </div>
        )}
        {engine.lastCheckedAt && <div>checked: {new Date(engine.lastCheckedAt).toLocaleString()}</div>}
        {!engine.enabled && <div className="text-orange-400">disabled</div>}
        {diagnostic?.openClawMvpDisabled && <div className="text-orange-400">disabled in MVP</div>}
        {diagnostic?.warnings?.map((w) => (
          <div key={w} className="text-yellow-400">{w}</div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => validate.mutate(engine.kind)}
            className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded"
          >
            Re-validate
          </button>
          <button
            onClick={() => resetBundled.mutate(engine.kind)}
            className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded"
          >
            Restore bundled default
          </button>
          <button
            onClick={() => clearPath.mutate(engine.kind)}
            className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded"
          >
            Clear custom path
          </button>
          <button
            onClick={() => setShowDetail((v) => !v)}
            className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded"
          >
            {showDetail ? "Hide detail" : "Provider details"}
          </button>
        </div>
        <div className="flex gap-2">
          <input
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            placeholder="Custom provider path"
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs"
          />
          <button
            onClick={() => setPath.mutate({ kind: engine.kind, path: customPath })}
            className="px-2 py-1 text-xs bg-blue-700 hover:bg-blue-600 rounded"
          >
            Apply path
          </button>
        </div>
      </div>
      {showDetail && (
        <div>
          <JsonView data={diagnostic ?? engine.metadata ?? {}} maxHeight="240px" />
        </div>
      )}
    </div>
  );
}
