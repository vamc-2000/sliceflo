import { create } from 'zustand';
import { configApi, ConfigRole } from '@/lib/api/config-api';

interface ConfigState {
  roles: ConfigRole[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchConfig: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  roles: [],
  isLoading: false,
  error: null,

  // 🔹 Fetch config
  fetchConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await configApi.getConfig();

      set({
        roles: res.roles ?? [],
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err?.response?.data?.message || 'Failed to fetch config',
        isLoading: false,
      });
    }
  },
}));
