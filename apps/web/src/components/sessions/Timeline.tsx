import type { Run } from "../../api/types.js";

const STATUS_DOT: Record<string, string> = {
  completed: "bg-green-400",
  failed: "bg-red-400",
  running: "bg-yellow-400 animate-pulse",
  pending: "bg-gray-600",
  cancelled: "bg-gray-700",
};

interface Props {
  runs: Run[];
  selectedRunId?: string;
  onSelect: (runId: string) => void;
}

export function Timeline({ runs, selectedRunId, onSelect }: Props) {
  return (
    <div className="space-y-1">
      {runs.map((run) => (
        <button
          key={run.id}
          onClick={() => onSelect(run.id)}
          className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded text-xs transition-colors ${
            run.id === selectedRunId ? "bg-blue-900/40 border border-blue-700" : "hover:bg-gray-800 border border-transparent"
          }`}
        >
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[run.status] ?? "bg-gray-600"}`} />
          <span className="text-gray-400 uppercase w-20 flex-shrink-0">{run.engineKind}</span>
          <span className="text-gray-300 flex-1 truncate">{run.prompt}</span>
          <span className="text-gray-600 flex-shrink-0">{run.status}</span>
        </button>
      ))}
    </div>
  );
}
