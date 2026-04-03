import { useEngines, useDiscoverEngines, useEngineDiagnostics } from "../hooks/useEngines.js";
import { EngineCard } from "../components/engines/EngineCard.js";
import { Loading } from "../components/common/Loading.js";

export function EnginesPage() {
  const { data, isLoading } = useEngines();
  const diagnosticsQ = useEngineDiagnostics();
  const discover = useDiscoverEngines();
  const diagnostics = diagnosticsQ.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-100">Engines</h1>
        <div className="flex gap-2">
          <button
            onClick={() => diagnosticsQ.refetch()}
            disabled={diagnosticsQ.isFetching}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white text-sm rounded transition-colors"
          >
            {diagnosticsQ.isFetching ? "Refreshing…" : "Re-validate"}
          </button>
          <button
            onClick={() => discover.mutate()}
            disabled={discover.isPending}
            className="px-4 py-1.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-sm rounded transition-colors"
          >
            {discover.isPending ? "Scanning…" : "Scan Engines"}
          </button>
        </div>
      </div>
      {isLoading ? <Loading /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data ?? []).map((e) => (
            <EngineCard
              key={e.kind}
              engine={e}
              diagnostic={diagnostics.find((d) => d.kind === e.kind)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
