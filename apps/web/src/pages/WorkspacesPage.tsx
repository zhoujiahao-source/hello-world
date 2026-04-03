import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client.js";
import type { Workspace } from "../api/types.js";
import { WorkspaceList } from "../components/workspaces/WorkspaceList.js";
import { WorkspaceForm } from "../components/workspaces/WorkspaceForm.js";
import { Loading } from "../components/common/Loading.js";
import { EmptyState } from "../components/common/EmptyState.js";

export function WorkspacesPage() {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => api.get<Workspace[]>("/workspaces"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-100">Workspaces</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded transition-colors"
        >
          {showForm ? "Cancel" : "+ New Workspace"}
        </button>
      </div>
      {showForm && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
          <WorkspaceForm onSuccess={() => setShowForm(false)} />
        </div>
      )}
      {isLoading ? <Loading /> : !data?.length ? (
        <EmptyState title="No workspaces yet" description="Create a workspace to get started." />
      ) : (
        <WorkspaceList workspaces={data} />
      )}
    </div>
  );
}
