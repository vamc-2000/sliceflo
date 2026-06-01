import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WhiteboardContent {
  elements: any[];
  appState: any;
}

interface Whiteboard {
  id: string;
  title: string;
  parentId: string | null;
  icon: string;
  content: WhiteboardContent;
  lastModified?: string;
}

interface WhiteboardStore {
  whiteboards: Whiteboard[];
  addWhiteboard: (whiteboard: Whiteboard) => void;
  updateWhiteboard: (id: string, updates: Partial<Whiteboard>) => void;
  deleteWhiteboard: (id: string) => void;
  getWhiteboardById: (id: string) => Whiteboard | undefined;
}

export const useWhiteboardStore = create<WhiteboardStore>()(
  persist(
    (set, get) => ({
      whiteboards: [],

      addWhiteboard: (whiteboard) =>
        set((state) => ({
          whiteboards: [...state.whiteboards, whiteboard],
        })),

      updateWhiteboard: (id, updates) =>
        set((state) => ({
          whiteboards: state.whiteboards.map((whiteboard) =>
            whiteboard.id === id ? { ...whiteboard, ...updates } : whiteboard
          ),
        })),

      deleteWhiteboard: (id) =>
        set((state) => ({
          whiteboards: state.whiteboards.filter((whiteboard) => whiteboard.id !== id),
        })),

      getWhiteboardById: (id) => {
        return get().whiteboards.find((whiteboard) => whiteboard.id === id);
      },
    }),
    {
      name: "whiteboard-storage", // localStorage key
    }
  )
);
