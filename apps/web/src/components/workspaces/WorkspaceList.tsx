import { Link } from "react-router-dom";
import type { Workspace } from "../../api/types.js";

interface Props {
  workspaces: Workspace[];
}

export function WorkspaceList({ workspaces }: Props) {
  return (
    <div className="space-y-2">
      {workspaces.map((ws) => (
        <Link
          key={ws.id}
          to={`/workspaces/${ws.id}`}
          className="block bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-100 font-medium">{ws.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded border ${ws.status === "active" ? "text-green-300 border-green-700" : "text-gray-500 border-gray-700"}`}>
              {ws.status}
            </span>
          </div>
          {ws.description && <p className="text-xs text-gray-500 mt-1">{ws.description}</p>}
          <p className="text-xs text-gray-600 mt-1 font-mono">{ws.path}</p>
        </Link>
      ))}
    </div>
  );
}
