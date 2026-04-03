import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client.js";
import type { Workspace } from "../../api/types.js";

interface Props {
  onSuccess?: (ws: Workspace) => void;
}

export function WorkspaceForm({ onSuccess }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [path, setPath] = useState("");
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: () => api.post<Workspace>("/workspaces", { name, description, path }),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["workspaces"] });
      setName(""); setDescription(""); setPath("");
      onSuccess?.(data);
    },
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); create.mutate(); }}
      className="space-y-3"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Workspace name"
        required
        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      />
      <input
        value={path}
        onChange={(e) => setPath(e.target.value)}
        placeholder="Workspace path (e.g. /projects/my-app)"
        required
        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 font-mono"
      />
      <button
        type="submit"
        disabled={create.isPending}
        className="w-full py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-sm rounded transition-colors"
      >
        {create.isPending ? "Creating…" : "Create Workspace"}
      </button>
      {create.isError && (
        <p className="text-red-400 text-xs">{create.error?.message}</p>
      )}
    </form>
  );
}
