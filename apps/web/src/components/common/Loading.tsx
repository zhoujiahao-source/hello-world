export function Loading({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const cls = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-10 h-10" : "w-6 h-6";
  return (
    <div className="flex items-center justify-center p-4">
      <div className={`${cls} border-2 border-blue-500 border-t-transparent rounded-full animate-spin`} />
    </div>
  );
}
