import { useState } from "react";
import type { EngineKind } from "@usb-ai-workbench/shared";
import { ENGINE_KINDS } from "@usb-ai-workbench/shared";
import { useStartRun } from "../../hooks/useSessionRuns.js";

interface Props {
  sessionId: string;
  engineKind: EngineKind;
}

export function MessageComposer({ sessionId, engineKind }: Props) {
  const [prompt, setPrompt] = useState("");
  const startRun = useStartRun();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    startRun.mutate({ sessionId, engineKind, prompt: prompt.trim() }, {
      onSuccess: () => setPrompt(""),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-800 p-4 flex gap-3">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void handleSubmit(e as unknown as React.FormEvent); }}
        placeholder="Enter prompt… (Ctrl+Enter to send)"
        rows={3}
        className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
      />
      <button
        type="submit"
        disabled={startRun.isPending || !prompt.trim()}
        className="px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-sm rounded transition-colors self-end"
      >
        {startRun.isPending ? "…" : "Run"}
      </button>
    </form>
  );
}
