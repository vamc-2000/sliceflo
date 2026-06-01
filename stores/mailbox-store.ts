// store/useEmailStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Email, MailboxListResponse, ProfileData } from '@/types/mailbox.types';
import axiosInstance from '@/lib/api/axios-instance';
import mailboxApi, { MailQueryParams } from '@/lib/api/mailbox-api';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
const USE_DUMMY_DATA = !API_BASE_URL; // Use dummy data when no API URL is provided

interface EmailState {
  emails: Email[];
  selectedEmail: Email | null;
  pagination?: MailboxListResponse["pagination"];
  loading: boolean;
  error: string | null;
  initialized: boolean;
  hasMore: boolean;
  // Modal state - just track if it's open, data comes from selectedEmail
  isProfileModalOpen: boolean;
  profileData?: ProfileData | null;
  setSelectedEmail: (email: Email | null) => void;
}

interface EmailActions {
  // Data Management
  setEmails: (emails: Email[]) => void;
  removeEmail: (id: string) => Promise<void>;
  setSelectedEmail: (email: Email | null) => void;

  // Email-specific actions
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;

  removeAllReadEmails: () => Promise<void>;
  removeAllEmails: () => Promise<void>;

  snoozeEmail: (id: string, until: string) => Promise<void>;
  unsnoozeEmail: (id: string) => Promise<void>;

  // API/Data operations
  // fetchEmails: (params?: Record<string, any>) => Promise<void>;
  fetchEmails: (params?: MailQueryParams) => Promise<void>;
  refreshEmails: () => Promise<void>;

  // Modal actions
  openProfileModal: (data: ProfileData) => void;
  closeProfileModal: () => void;

  loadMoreEmails: (params?: MailQueryParams) => Promise<void>;
  hasMore: boolean;

  // Utility
  clearEmails: () => void;
  clearError: () => void;
  reset: () => void;
}

export type EmailStore = EmailState & EmailActions;

// Store Implementation
export const mailStore = create<EmailStore>()(
  persist(
    (set, get) => ({
      // Initial State
      emails: [],
      selectedEmail: null,
      pagination: undefined,
      loading: false,
      hasMore: false,
      error: null,
      initialized: false,
      isProfileModalOpen: false,

      // Basic State Management
      setEmails: (emails) => set({ emails }),

      setSelectedEmail: (email) => {
        set({ selectedEmail: email });
      },

      clearError: () => set({ error: null }),

      clearEmails: () => set({ emails: [], selectedEmail: null }),

      reset: () => {
        localStorage.removeItem('mailbox-storage');  
      },

      // Modal actions - no need to store duplicate data
      openProfileModal: (data) => set({ isProfileModalOpen: true, profileData: data }),
      closeProfileModal: () => set({ isProfileModalOpen: false, profileData: null }),

      fetchEmails: async (params: MailQueryParams = {}) => {
        const { clearError } = get();
        set({ loading: true });
        clearError();

        try {
          const { emails, pagination } = await mailboxApi.getMails({
            limit: 100,
            offset: 0,
            ...params,
          });

          const normalizedEmails = emails.map((e) => ({
            ...e,
            _id: e._id ?? e.id,
          }));

          set({
            emails: normalizedEmails,
            pagination,
            loading: false,
            initialized: true,
            hasMore: pagination?.hasMore ?? false, // ✅ set hasMore from API
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : "Failed to fetch emails",
            initialized: true,
          });
        }
      },

      loadMoreEmails: async (params: MailQueryParams = {}) => {
        const { pagination, emails } = get();
        if (!pagination?.hasMore) return; // nothing more to load

        set({ loading: true });

        try {
          const nextOffset = (pagination?.offset ?? 0) + (pagination?.limit ?? 100);

          const { emails: newEmails, pagination: newPagination } =
            await mailboxApi.getMails({
              limit: 100,
              offset: nextOffset,
              ...params,
            });

          const normalizedNew = newEmails.map((e) => ({
            ...e,
            _id: e._id ?? e.id,
          }));

          set({
            emails: [...emails, ...normalizedNew], // ✅ append, not replace
            pagination: newPagination,
            loading: false,
            hasMore: newPagination?.hasMore ?? false,
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : "Failed to load more emails",
          });
        }
      },

      refreshEmails: async () => {
        await get().fetchEmails({
          offset: get().pagination?.offset ?? 0,
          limit: get().pagination?.limit ?? 100,
        });
      },

      removeEmail: async (id: string) => {
        set({ loading: true });

        try {
          const store = await mailboxApi.deleteMail(id);
          console.log("Remove email: ", store);


          set((state) => ({
            loading: false,
            emails: state.emails.filter((e) => e._id !== id),
            selectedEmail:
              state.selectedEmail?._id === id ? null : state.selectedEmail,
          }));
        } catch (err: any) {
          set({
            loading: false,
            error: err?.message ?? "Failed to delete email",
          });
        }
      },

      // NEW: Delete all read emails
      removeAllReadEmails: async () => {
        set({ loading: true, error: null });
        try {
          const state = get();
          const unreadEmails = state.emails.filter((email) => !email.read);
          // If you're using API, you can call a bulk delete endpoint here.
          set({ emails: unreadEmails, selectedEmail: null, loading: false });
        } catch (error) {
          set({
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to remove read emails",
          });
        }
      },

      // // NEW: Delete all emails
      removeAllEmails: async () => {
        set({ loading: true, error: null });
        try {
          // If you have API endpoint to delete all, call it here
          set({ emails: [], selectedEmail: null, loading: false });
        } catch (error) {
          set({
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to remove all emails",
          });
        }
      },

      markAsRead: async (id: string) => {
        try {
          await mailboxApi.updateMailAsRead(id, { read: true });

          set((state) => ({
            emails: state.emails.map((e) =>
              e._id === id ? { ...e, read: true } : e
            ),
            selectedEmail:
              state.selectedEmail?._id === id
                ? { ...state.selectedEmail, read: true }
                : state.selectedEmail,
          }));
        } catch (err) {
          console.error("Failed to mark mail read", err);
        }
      },

      markAsUnread: async (id: string) => {
        try {
          await mailboxApi.updateMailAsUnRead(id, { read: false });

          set((state) => ({
            emails: state.emails.map((e) =>
              e._id === id ? { ...e, read: false } : e
            ),
            selectedEmail:
              state.selectedEmail?._id === id
                ? { ...state.selectedEmail, read: false }
                : state.selectedEmail,
          }));
        } catch (err) {
          console.error("Failed to mark mail unread", err);
        }
      },

      snoozeEmail: async (id: string, until) => {
        await mailboxApi.snoozeMail(id, { snoozed: true, snoozedUntil: until });

        set((state) => ({
          emails: state.emails.map((e) =>
            e._id === id ? { ...e, snoozed: true, snoozedUntil: until } : e
          ),
          selectedEmail:
            state.selectedEmail?._id === id
              ? { ...state.selectedEmail, snoozed: true, snoozedUntil: until }
              : state.selectedEmail,
        }));
      },

      unsnoozeEmail: async (id: string) => {
        await mailboxApi.unsnoozeMail(id, { snoozed: false, snoozedUntil: null });

        set((state) => ({
          emails: state.emails.map((e) =>
            e._id === id ? { ...e, snoozed: false, snoozedUntil: null } : e
          ),
          selectedEmail:
            state.selectedEmail?._id === id
              ? { ...state.selectedEmail, snoozed: false, snoozedUntil: null }
              : state.selectedEmail,
        }));
      },

    }),
    {
      name: "mailbox-storage", // localStorage key
      partialize: (state) => ({
        emails: state.emails,
        selectedEmail: state.selectedEmail,
        // initialized: state.initialized,
      }),
    }
  )
);

export const useEmails = () => mailStore((state) => state.emails);
export const useSelectedEmail = () => mailStore((state) => state.selectedEmail);
export const useEmailLoading = () => mailStore((state) => state.loading);
export const useEmailError = () => mailStore((state) => state.error);
export const useEmailInitialized = () => mailStore((state) => state.initialized);
export const useSetSelectedEmail = () => mailStore((state) => state.setSelectedEmail);
export const useFetchEmails = () => mailStore((state) => state.fetchEmails);
export const useOpenProfileModal = () => mailStore((state) => state.openProfileModal);
export const useProfileData = () => mailStore((s) => s.profileData);
export const useIsProfileModalOpen = () => mailStore((s) => s.isProfileModalOpen);
export const useCloseProfileModal = () => mailStore((s) => s.closeProfileModal);
export const useMarkAsRead = () => mailStore((s) => s.markAsRead);
export const useMarkAsUnread = () => mailStore((s) => s.markAsUnread);
export const useHasMore = () => mailStore((state) => state.hasMore);
export const useLoadMoreEmails = () => mailStore((state) => state.loadMoreEmails);

// Generic hook to access entire mailStore
export const useMailStore = mailStore;

// Selector to compute unread count
export const selectUnreadCount = (state: EmailStore) =>
  state.emails.filter((email) => !email.read).length;