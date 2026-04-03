import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client.js";
import { Loading } from "../components/common/Loading.js";

interface LogFile {
  name: string;
  size: number;
  modified: string;
}

interface LogContent {
  lines: string[];
  total: number;
}

export function LogsPage() {
  const [selected, setSelected] = useState<string | null>(null);

  const { data: files, isLoading } = useQuery({
    queryKey: ["logs"],
    queryFn: () => api.get<LogFile[]>("/logs"),
    refetchInterval: 30000,
  });

  const { data: content } = useQuery({
    queryKey: ["log-content", selected],
    queryFn: () => api.get<LogContent>(`/logs/${selected}?tail=200`),
    enabled: !!selected,
    refetchInterval: 5000,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-100">Logs</h1>
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-1 space-y-1">
          {isLoading ? <Loading size="sm" /> : (files ?? []).map((f) => (
            <button key={f.name} onClick={() => setSelected(f.name)}
              className={`w-full text-left px-3 py-2 rounded text-xs transition-colors ${selected === f.name ? "bg-blue-900/40 text-blue-300" : "text-gray-400 hover:bg-gray-800"}`}>
              <div className="truncate">{f.name}</div>
              <div className="text-gray-600">{Math.round(f.size / 1024)}KB</div>
            </button>
          ))}
          {!files?.length && !isLoading && <p className="text-gray-600 text-xs px-3">No log files</p>}
        </div>
        <div className="col-span-3">
          {content ? (
            <div className="bg-gray-950 border border-gray-800 rounded p-3 h-[600px] overflow-y-auto scrollbar-thin">
              {content.lines.map((line, i) => (
                <div key={i} className="text-xs font-mono text-green-400 leading-5">{line}</div>
              ))}
            </div>
          ) : (
            <div className="text-gray-600 text-xs mt-4">Select a log file to view</div>
          )}
        </div>
      </div>
    </div>
  );
}
