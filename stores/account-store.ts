// store/accountStore.ts
import axiosInstance from '@/lib/api/axios-instance';
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Types
export type ThemeType = "lightmode" | "darkmode" | "default";

export interface NotificationSettings {
  isMuted: boolean;
  muteUntil: string | null;
  notificationLevel: "all" | "important" | "none";
  notificationTiming: "immediate" | "daily" | "weekly";
  previousSettings?: Omit<NotificationSettings, "isMuted" | "muteUntil" | "notificationLevel" | "notificationTiming" | "storedNotifications" | "previousSettings">;
  storedNotifications: Record<string, string[][]>;
  
  // Nested notification settings
  general?: {
    invitedaccepted?: boolean;
    privacyLegal?: boolean;
    dataProcessing?: boolean;
    changelog?: boolean;
  };
  email?: {
    enabled?: boolean;
    delayLowPriority?: boolean;
    immediatelyNotifyUrgent?: boolean;
    assignments?: boolean;
    statusChanges?: boolean;
    commentsAndReplies?: boolean;
    mentions?: boolean;
    reactions?: boolean;
    subscriptions?: boolean;
    documentChanges?: boolean;
    updates?: boolean;
    remindersAndDeadlines?: boolean;
    appsAndIntegrations?: boolean;
  };
  mailbox?: {
    enabled?: boolean;
    assignments?: boolean;
    statusChanges?: boolean;
    commentsAndReplies?: boolean;
    mentions?: boolean;
    reactions?: boolean;
    subscriptions?: boolean;
    documentChanges?: boolean;
    updates?: boolean;
    remindersAndDeadlines?: boolean;
    appsAndIntegrations?: boolean;
  };
  slack?: {
    enabled?: boolean;
    assignments?: boolean;
    statusChanges?: boolean;
    commentsAndReplies?: boolean;
    mentions?: boolean;
    reactions?: boolean;
    subscriptions?: boolean;
    documentChanges?: boolean;
    updates?: boolean;
    remindersAndDeadlines?: boolean;
    appsAndIntegrations?: boolean;
  };
  teams?: {
    enabled?: boolean;
    assignments?: boolean;
    statusChanges?: boolean;
    commentsAndReplies?: boolean;
    mentions?: boolean;
    reactions?: boolean;
    subscriptions?: boolean;
    documentChanges?: boolean;
    updates?: boolean;
    remindersAndDeadlines?: boolean;
    appsAndIntegrations?: boolean;
  };
  smart?: {
    summarizeDaily?: boolean;
    summarizeMentionsOnly?: boolean;
    option3?: boolean;
    option4?: boolean;
  };
}

interface AccountState {
  // Core state
  theme: ThemeType;
  customization: Record<string, unknown>;
  notificationSettings: NotificationSettings;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  setTheme: (theme: ThemeType) => void;
  setCustomization: (customization: Record<string, unknown>) => void;
  setNotificationSettings: (
    settings: Partial<NotificationSettings> | ((prev: NotificationSettings) => NotificationSettings)
  ) => void;

  // Notification actions
  muteNotifications: (muteUntil: string, settingsBackup: any) => void;
  resumeNotifications: () => void;
  storeNotification: (group: string, value: string) => void;
  clearStoredNotifications: () => void;

  // API actions
  fetchUsersList: (params: {
    page?: number;
    rowsPerPage?: number;
    searchQuery?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<any>;
  saveAccountSettings: () => Promise<void>;
  muteNotificationsCall: () => Promise<void>;
  unMuteNotificationsCall: () => Promise<void>;
  reset: () => void;
}

//  SINGLE INITIAL STATE (removed duplicates)
const initialNotificationSettings: NotificationSettings = {
  isMuted: false,
  muteUntil: null,
  notificationLevel: "all",
  notificationTiming: "immediate",
  storedNotifications: {},
  general: {
    invitedaccepted: false,
    privacyLegal: false,
    dataProcessing: false,
    changelog: false,
  },
  email: {
    enabled: false,
    delayLowPriority: false,
    immediatelyNotifyUrgent: false,
    assignments: false,
    statusChanges: false,
    commentsAndReplies: false,
    mentions: false,
    reactions: false,
    subscriptions: false,
    documentChanges: false,
    updates: false,
    remindersAndDeadlines: false,
    appsAndIntegrations: false,
  },
  mailbox: {
    enabled: false,
    assignments: false,
    statusChanges: false,
    commentsAndReplies: false,
    mentions: false,
    reactions: false,
    subscriptions: false,
    documentChanges: false,
    updates: false,
    remindersAndDeadlines: false,
    appsAndIntegrations: false,
  },
  slack: {
    enabled: false,
    assignments: false,
    statusChanges: false,
    commentsAndReplies: false,
    mentions: false,
    reactions: false,
    subscriptions: false,
    documentChanges: false,
    updates: false,
    remindersAndDeadlines: false,
    appsAndIntegrations: false,
  },
  teams: {
    enabled: false,
    assignments: false,
    statusChanges: false,
    commentsAndReplies: false,
    mentions: false,
    reactions: false,
    subscriptions: false,
    documentChanges: false,
    updates: false,
    remindersAndDeadlines: false,
    appsAndIntegrations: false,
  },
  smart: {
    summarizeDaily: false,
    summarizeMentionsOnly: false,
    option3: false,
    option4: false,
  },
};

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: "default",
      customization: {},
      notificationSettings: initialNotificationSettings,
      isLoading: false,
      error: null,

      // Theme actions
      setTheme: (theme) => {
        set({ theme });
      },

      setCustomization: (customization) => {
        set({ customization });
      },

      // Notification settings actions
    setNotificationSettings: (settings) => {
        set((state) => ({
          notificationSettings: typeof settings === 'function'
            ? settings(state.notificationSettings)
            : {
                ...state.notificationSettings,
                ...settings,
              },
        }));
      },

      muteNotifications: (muteUntil, settingsBackup) => {
        set((state) => ({
          notificationSettings: {
            ...state.notificationSettings,
            isMuted: true,
            muteUntil,
            previousSettings: settingsBackup,
          },
        }));
      },

      resumeNotifications: () => {
        set((state) => {
          const { previousSettings } = state.notificationSettings;
          const newSettings = {
            ...state.notificationSettings,
            isMuted: false,
            muteUntil: null,
          };

          // Restore previous settings if available
          if (previousSettings) {
            Object.assign(newSettings, previousSettings);
            delete newSettings.previousSettings;
          }

          return {
            notificationSettings: newSettings,
          };
        });
      },

      storeNotification: (group, value) => {
        set((state) => {
          const storedNotifications = { ...state.notificationSettings.storedNotifications };

          if (!storedNotifications[group]) {
            storedNotifications[group] = [[]];
          }

          const groupArr = storedNotifications[group];
          if (groupArr.length === 0 || groupArr[groupArr.length - 1].length >= 5) {
            groupArr.push([value]);
          } else {
            groupArr[groupArr.length - 1].push(value);
          }

          return {
            notificationSettings: {
              ...state.notificationSettings,
              storedNotifications,
            },
          };
        });
      },

      clearStoredNotifications: () => {
        set((state) => ({
          notificationSettings: {
            ...state.notificationSettings,
            storedNotifications: {},
          },
        }));
      },

      // API actions
      fetchUsersList: async (params = {}) => {
        const { page = 1, rowsPerPage = 10, searchQuery = '', sortBy = '', sortOrder = '' } = params;

        try {
          const response = await axiosInstance.get(
            `profile/users-list?page=${page}&limit=${rowsPerPage}&search=${searchQuery}&sortBy=${sortBy}&sortOrder=${sortOrder}`
          );
          return response.data;
        } catch (error: any) {
          set({ error: error.message || 'Failed to fetch users list' });
          throw error;
        }
      },

      saveAccountSettings: async () => {
        const state = get();
        set({ isLoading: true, error: null });

        try {
          const body = {
            theme: state.theme,
            customization: state.customization,
            notificationSettings: state.notificationSettings,
          };

          // ===== MOCK RESPONSE (Comment out when API is ready) =====
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log("Account settings saved (mock mode):", body);
          // ===== END MOCK RESPONSE =====

        
          // const response = await axiosInstance.post('/account/settings', body);
          // console.log("Account settings saved:", response.data);

          set({ isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to save account settings',
          });
          throw error;
        }
      },

      muteNotificationsCall: async () => {
        try {
          // ===== MOCK RESPONSE (Comment out when API is ready) =====
          // console.log("Mute notifications (mock mode)");
          // await new Promise(resolve => setTimeout(resolve, 300));
          // const mockResponse = {
          //   success: true,
          //   message: "Notifications muted successfully",
          //   data: {
          //     notificationsEnabled: false,
          //     updatedAt: new Date().toISOString()
          //   }
          // };
          // console.log("Mute notifications response:", mockResponse);
          // return mockResponse;
          // ===== END MOCK RESPONSE =====

          // ===== REAL API (Uncomment when ready) =====
          const response = await axiosInstance.post('/profile/notifications/mute');
          console.log("Mute notifications response:", response.data);
          return response.data;
          // ===== END REAL API =====
        } catch (error: any) {
          set({ error: error.message || 'Failed to mute notifications' });
          throw error;
        }
      },

      unMuteNotificationsCall: async () => {
        try {
          // ===== MOCK RESPONSE (Comment out when API is ready) =====
          console.log("Unmute notifications (mock mode)");
          await new Promise(resolve => setTimeout(resolve, 300));
          const mockResponse = {
            success: true,
            message: "Notifications unmuted successfully",
            data: {
              notificationsEnabled: true,
              updatedAt: new Date().toISOString()
            }
          };
          console.log("Unmute notifications response:", mockResponse);
          // return mockResponse;
          // ===== END MOCK RESPONSE =====

          // ===== REAL API (Uncomment when ready) =====
          // const response = await axiosInstance.post('/profile/notifications/unmute');
          // console.log("Unmute notifications response:", response.data);
          // return response.data;
          // ===== END REAL API =====
        } catch (error: any) {
          set({ error: error.message || 'Failed to unmute notifications' });
          throw error;
        }
      },

      reset: () => {
        localStorage.removeItem('account-storage');
      },
    }),
    {
      name: 'account-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        customization: state.customization,
        notificationSettings: state.notificationSettings,
      }),
    }
  )
);
