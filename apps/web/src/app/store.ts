import { create } from "zustand";

interface AppState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeEngineFilter: string | null;
  setActiveEngineFilter: (kind: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  activeEngineFilter: null,
  setActiveEngineFilter: (kind) => set({ activeEngineFilter: kind }),
}));
