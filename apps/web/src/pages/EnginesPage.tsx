import { useEngines, useDiscoverEngines } from "../hooks/useEngines.js";
import { EngineCard } from "../components/engines/EngineCard.js";
import { Loading } from "../components/common/Loading.js";

export function EnginesPage() {
  const { data, isLoading } = useEngines();
  const discover = useDiscoverEngines();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-100">Engines</h1>
        <button
          onClick={() => discover.mutate()}
          disabled={discover.isPending}
          className="px-4 py-1.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-sm rounded transition-colors"
        >
          {discover.isPending ? "Scanning…" : "Scan Engines"}
        </button>
      </div>
      {isLoading ? <Loading /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data ?? []).map((e) => <EngineCard key={e.kind} engine={e} />)}
        </div>
      )}
    </div>
  );
}
