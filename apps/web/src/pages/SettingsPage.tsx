import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client.js";
import type { Setting, RuntimeInfoResponse } from "../api/types.js";
import { Loading } from "../components/common/Loading.js";
import { JsonView } from "../components/common/JsonView.js";

export function SettingsPage() {
  const qc = useQueryClient();
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<Setting[]>("/settings"),
  });
  const runtimeQ = useQuery({
    queryKey: ["runtime-info"],
    queryFn: () => api.get<RuntimeInfoResponse>("/runtime-info"),
  });

  const upsert = useMutation({
    mutationFn: () => api.put<Setting>(`/settings/${key}`, { value }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["settings"] }); setKey(""); setValue(""); },
  });

  const del = useMutation({
    mutationFn: (k: string) => api.delete(`/settings/${k}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["settings"] }),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-lg font-bold text-gray-100">Settings</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Add / Update Setting</h2>
        <form onSubmit={(e) => { e.preventDefault(); upsert.mutate(); }} className="flex gap-3">
          <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Key" required
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value" required
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500" />
          <button type="submit" disabled={upsert.isPending}
            className="px-4 py-1.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-sm rounded transition-colors">
            Save
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Current Settings</h2>
        {isLoading ? <Loading /> : (
          <div className="space-y-2">
            {(settings ?? []).map((s) => (
              <div key={s.key} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded p-3">
                <span className="text-xs font-mono text-blue-300 w-40 flex-shrink-0 truncate">{s.key}</span>
                <span className="text-xs text-gray-400 flex-1 truncate">{s.value}</span>
                <button onClick={() => del.mutate(s.key)} className="text-xs text-red-400 hover:text-red-200 flex-shrink-0">
                  Delete
                </button>
              </div>
            ))}
            {!settings?.length && <p className="text-gray-600 text-xs">No settings configured</p>}
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-400">Portable Bundle Metadata</h2>
        {!runtimeQ.data?.manifest?.exists && (
          <div className="text-xs text-yellow-400">manifest.json is missing.</div>
        )}
        {runtimeQ.data?.manifest?.exists && !runtimeQ.data?.manifest?.valid && (
          <div className="text-xs text-yellow-400">manifest.json exists but is incomplete/invalid.</div>
        )}
        <div className="text-xs text-gray-500">Runtime mode: {runtimeQ.data?.runtime.mode ?? "-"}</div>
        <div className="text-xs text-gray-500 truncate">Bundle root: {runtimeQ.data?.runtime.bundleRoot ?? "-"}</div>
        <div className="text-xs text-gray-500 truncate">Manifest path: {runtimeQ.data?.manifest.path ?? "-"}</div>
        <JsonView data={runtimeQ.data?.manifest?.manifest ?? {}} maxHeight="260px" />
      </div>
    </div>
  );
}
