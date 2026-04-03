import { NavLink } from "react-router-dom";
import { useAppStore } from "../../app/store.js";

const NAV_ITEMS = [
  { to: "/dashboard", icon: "⬡", label: "Dashboard" },
  { to: "/engines", icon: "⚙", label: "Engines" },
  { to: "/workspaces", icon: "📁", label: "Workspaces" },
  { to: "/sessions", icon: "💬", label: "Sessions" },
  { to: "/schedules", icon: "🕐", label: "Schedules" },
  { to: "/logs", icon: "📋", label: "Logs" },
  { to: "/settings", icon: "🔧", label: "Settings" },
];

export function Sidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  if (!sidebarOpen) return null;

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-gray-900 border-r border-gray-800 flex flex-col z-10">
      <div className="px-4 py-5 border-b border-gray-800">
        <span className="text-blue-400 font-bold text-base">⚡ USB AI Workbench</span>
      </div>
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-blue-900/40 text-blue-300 border-r-2 border-blue-400"
                  : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 text-xs text-gray-600 border-t border-gray-800">
        v0.1.0 · local-first
      </div>
    </aside>
  );
}
