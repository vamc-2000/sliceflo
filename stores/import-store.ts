// stores/import-store.ts
import { create } from 'zustand';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface ImportRecord {
    id: string;
    type: string;           // "Spreadsheet" | "CSV" | etc.
    status: 'Completed' | 'Ongoing' | 'Failed';
    statusColor: 'success' | 'warning' | 'error';
    importedNumber: string; // e.g. "12 of 12 projects imported"
    expiryDate: string;     // formatted date string
    projectIds: string[];   // IDs of projects created from this import
}

export interface ImportedProject {
    id: string;
    name: string;
    description?: string;
    status?: string;
    priority?: string;
    color: string;          // random from preset palette
    importedAt: string;
}

// ──────────────────────────────────────────────
// Color palette for imported projects
// ──────────────────────────────────────────────

const PROJECT_COLORS = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#F59E0B', // amber
    '#8B5CF6', // violet
    '#EF4444', // red
    '#06B6D4', // cyan
    '#F97316', // orange
    '#EC4899', // pink
];

const getRandomColor = () =>
    PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];

// ──────────────────────────────────────────────
// State + Actions
// ──────────────────────────────────────────────

interface ImportState {
    importRecords: ImportRecord[];
    importedProjects: ImportedProject[];

    addImportRecord: (record: Omit<ImportRecord, 'id'>) => string;
    addImportedProjects: (projects: Omit<ImportedProject, 'id'>[]) => string[];
    clearImportedProjects: () => void;
    deleteImportRecord: (id: string) => void;
}

export const useImportStore = create<ImportState>()((set) => ({
    importRecords: [],
    importedProjects: [],

    // ──────────────────────────────────────────
    // addImportRecord — appends a new history row
    // ──────────────────────────────────────────
    addImportRecord: (record) => {
        const id = `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        set((state) => ({
            importRecords: [{ id, ...record }, ...state.importRecords],
        }));
        return id;
    },

    // ──────────────────────────────────────────
    // addImportedProjects — stores lightweight imported project objects
    // ──────────────────────────────────────────
    addImportedProjects: (projects) => {
        const created: ImportedProject[] = projects.map((p) => ({
            id: `imported-project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            ...p,
            color: p.color || getRandomColor(),
        }));

        set((state) => ({
            importedProjects: [...state.importedProjects, ...created],
        }));

        return created.map((p) => p.id);
    },

    // ──────────────────────────────────────────
    // clearImportedProjects — reset lightweight list
    // ──────────────────────────────────────────
    clearImportedProjects: () => set({ importedProjects: [] }),

    // ──────────────────────────────────────────
    // deleteImportRecord — remove a history row
    // ──────────────────────────────────────────
    deleteImportRecord: (id) =>
        set((state) => ({
            importRecords: state.importRecords.filter((r) => r.id !== id),
        })),
}));
