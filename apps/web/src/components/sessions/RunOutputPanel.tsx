import { useState, useEffect, useRef } from "react";
import { useSSE } from "../../hooks/useSSE.js";
import type { Run } from "../../api/types.js";

interface Props {
  run: Run;
}

interface OutputLine {
  chunk: string;
  stream: "stdout" | "stderr";
  timestamp: string;
}

export function RunOutputPanel({ run }: Props) {
  const [lines, setLines] = useState<OutputLine[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useSSE(run.status === "running" ? `/api/v1/runs/${run.id}/stream` : null, {
    onMessage: (e) => {
      if (e.type === "run:output") {
        try {
          const data = JSON.parse(e.data) as OutputLine;
          setLines((prev) => [...prev, data]);
        } catch { /* ignore */ }
      }
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  if (!lines.length && run.status !== "running") {
    return (
      <div className="text-xs text-gray-600 p-3">
        {run.status === "completed" ? "Run completed." : run.status === "failed" ? "Run failed." : "Waiting for output…"}
      </div>
    );
  }

  return (
    <div className="bg-gray-950 rounded border border-gray-800 p-3 h-64 overflow-y-auto text-xs font-mono scrollbar-thin">
      {lines.map((line, i) => (
        <div key={i} className={line.stream === "stderr" ? "text-red-400" : "text-green-300"}>
          {line.chunk}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
