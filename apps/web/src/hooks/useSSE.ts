import { useEffect, useRef, useCallback } from "react";

interface SSEOptions {
  onMessage: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
}

export function useSSE(url: string | null, options: SSEOptions) {
  const esRef = useRef<EventSource | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    if (!url) return;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (e) => optionsRef.current.onMessage(e);
    es.addEventListener("run:output", (e) => optionsRef.current.onMessage(e as MessageEvent));
    es.addEventListener("run:status", (e) => optionsRef.current.onMessage(e as MessageEvent));
    es.addEventListener("session:status", (e) => optionsRef.current.onMessage(e as MessageEvent));
    es.addEventListener("ping", () => {});

    es.onerror = (e) => {
      optionsRef.current.onError?.(e);
      es.close();
      esRef.current = null;
    };

    return es;
  }, [url]);

  useEffect(() => {
    if (!url) return;
    const es = connect();
    return () => {
      es?.close();
      esRef.current = null;
    };
  }, [url, connect]);
}
