import { useAppStore } from "../../app/store.js";

export function Topbar() {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <header className="h-12 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-3 flex-shrink-0">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="text-gray-400 hover:text-gray-100 transition-colors"
        title="Toggle sidebar"
      >
        ☰
      </button>
      <div className="flex-1" />
      <a
        href="/api/v1/health"
        target="_blank"
        rel="noreferrer"
        className="text-xs text-gray-500 hover:text-blue-400 transition-colors"
      >
        API
      </a>
    </header>
  );
}
