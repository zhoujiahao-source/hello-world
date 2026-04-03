import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client.js";
import { ENGINE_KINDS } from "@usb-ai-workbench/shared";
import type { Schedule } from "../../api/types.js";

interface Props {
  workspaceId: string;
  onSuccess?: () => void;
}

export function ScheduleForm({ workspaceId, onSuccess }: Props) {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [cronExpr, setCronExpr] = useState("0 * * * *");
  const [engineKind, setEngineKind] = useState<string>("claude");
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: () =>
      api.post<Schedule>("/schedules", { workspaceId, title, prompt, cronExpr, engineKind }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["schedules"] });
      setTitle(""); setPrompt(""); setCronExpr("0 * * * *");
      onSuccess?.();
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
      <select value={engineKind} onChange={(e) => setEngineKind(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
        {ENGINE_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
      </select>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Prompt" required rows={3} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
      <input value={cronExpr} onChange={(e) => setCronExpr(e.target.value)} placeholder="Cron expression (e.g. 0 * * * *)" required className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500" />
      <button type="submit" disabled={create.isPending} className="w-full py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-sm rounded transition-colors">
        {create.isPending ? "Creating…" : "Create Schedule"}
      </button>
      {create.isError && <p className="text-red-400 text-xs">{create.error?.message}</p>}
    </form>
  );
}
