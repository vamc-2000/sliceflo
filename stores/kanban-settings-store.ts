// stores/kanban-settings-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface KanbanSettings {
    projectId: string;
    hiddenColumns: string[]; // Status IDs that are hidden
    cardSettings: {
        showAvatar: boolean;
        showDates: boolean;
        showPriority: boolean;
        showSubtasks: boolean;
    };
}

interface KanbanSettingsState {
    settings: Record<string, KanbanSettings>; // Keyed by projectId
    getSettings: (projectId: string) => KanbanSettings;
    updateCardSettings: (projectId: string, settings: Partial<KanbanSettings['cardSettings']>) => void;
    toggleColumnVisibility: (projectId: string, columnId: string) => void;
    hideColumn: (projectId: string, columnId: string) => void;
    showColumn: (projectId: string, columnId: string) => void;
}

const defaultCardSettings = {
    showAvatar: true,
    showDates: true,
    showPriority: true,
    showSubtasks: true,
};

export const useKanbanSettingsStore = create<KanbanSettingsState>()(
    persist(
        (set, get) => ({
            settings: {},

            getSettings: (projectId: string) => {
                const existing = get().settings[projectId];
                if (existing) return existing;

                return {
                    projectId,
                    hiddenColumns: [],
                    cardSettings: defaultCardSettings,
                };
            },

            updateCardSettings: (projectId, newSettings) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        [projectId]: {
                            ...state.settings[projectId],
                            projectId,
                            hiddenColumns: state.settings[projectId]?.hiddenColumns || [],
                            cardSettings: {
                                ...(state.settings[projectId]?.cardSettings || defaultCardSettings),
                                ...newSettings,
                            },
                        },
                    },
                }));
            },

            toggleColumnVisibility: (projectId, columnId) => {
                set((state) => {
                    const currentSettings = state.settings[projectId] || {
                        projectId,
                        hiddenColumns: [],
                        cardSettings: defaultCardSettings,
                    };

                    const isHidden = currentSettings.hiddenColumns.includes(columnId);

                    return {
                        settings: {
                            ...state.settings,
                            [projectId]: {
                                ...currentSettings,
                                hiddenColumns: isHidden
                                    ? currentSettings.hiddenColumns.filter(c => c !== columnId)
                                    : [...currentSettings.hiddenColumns, columnId],
                            },
                        },
                    };
                });
            },

            hideColumn: (projectId, columnId) => {
                set((state) => {
                    const currentSettings = state.settings[projectId] || {
                        projectId,
                        hiddenColumns: [],
                        cardSettings: defaultCardSettings,
                    };

                    if (currentSettings.hiddenColumns.includes(columnId)) {
                        return state;
                    }

                    return {
                        settings: {
                            ...state.settings,
                            [projectId]: {
                                ...currentSettings,
                                hiddenColumns: [...currentSettings.hiddenColumns, columnId],
                            },
                        },
                    };
                });
            },

            showColumn: (projectId, columnId) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        [projectId]: {
                            ...(state.settings[projectId] || {
                                projectId,
                                hiddenColumns: [],
                                cardSettings: defaultCardSettings,
                            }),
                            hiddenColumns: (state.settings[projectId]?.hiddenColumns || [])
                                .filter(c => c !== columnId),
                        },
                    },
                }));
            },
        }),
        {
            name: 'kanban-settings-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
