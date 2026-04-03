interface Props {
  data: unknown;
  maxHeight?: string;
}

export function JsonView({ data, maxHeight = "200px" }: Props) {
  return (
    <pre
      className="bg-gray-950 border border-gray-800 rounded p-3 text-xs text-green-400 overflow-auto scrollbar-thin"
      style={{ maxHeight }}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
