import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  uploadProfilePicture,
  updateProfile,
  fetchProfile,
  ProfileUpdatePayload,
  ProfilePictureResponse,
  ProfileResponse,
  deleteAccount,
  deactivateAccount,
  defaultWorkspace,
  updateDiscussionPins,
  fetchMyWork
} from '@/lib/api/profile-api';
import { DefaultWorkspaceRequest, DefaultWorkspaceResponse, Profile, UpdateDiscussionPinPayload, MyWorkResponse } from '@/types/profile.types';
import type { DiscussionType } from "@/types/discussions.types";
import { UserRole } from '@/types/profile.types';
import { buildDiscussionPinPayload } from '@/utils/pinDiscussions';
import { useProjectsStore } from './projects-store';

export const workspaceRoles = [
  { id: 1, name: "Admin" as UserRole },
  { id: 2, name: "Member" as UserRole },
  { id: 3, name: "Viewer" as UserRole },
  { id: 4, name: "Guest" as UserRole },
];

const deserializeTailoredViews = (rawViews: any): any[] => {
  if (!rawViews) return [];

  const viewsArray = Array.isArray(rawViews)
    ? rawViews
    : Object.values(rawViews);

  return viewsArray.map((view: any) => {
    if (!view) return view;

    const updatedView = { ...view };

    if (updatedView.filters) {
      const children = updatedView.filters.children;
      updatedView.filters = {
        ...updatedView.filters,
        children: children
          ? (Array.isArray(children) ? children : Object.values(children))
          : []
      };
    }

    return updatedView;
  });
};

interface ProfileState {
  user: Profile | null;
  profilesById: Record<string, Profile>;
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
  workspaceRoles: typeof workspaceRoles;
  myWork: MyWorkResponse | null;

  setUser: (user: Profile) => void;
  fetchUserProfile: () => Promise<Profile>;
  fetchMyWork: (days?: number) => Promise<MyWorkResponse>;
  updateUserProfile: (payload: ProfileUpdatePayload) => Promise<ProfileResponse>;

  // updateDiscussionPins: (payload: UpdateDiscussionPinPayload) => Promise<ProfileResponse>;
  toggleDiscussionPin: (
    type: DiscussionType,
    contextId: string,
    discussionId: string,
    shouldPin: boolean
  ) => Promise<void>;

  uploadUserProfilePicture: (file: File) => Promise<ProfilePictureResponse>;
  postDefaultWorkspace: (payload: DefaultWorkspaceRequest) => Promise<DefaultWorkspaceResponse>;
  deactivateUserAccount: () => Promise<ProfileResponse>;
  deleteUserAccount: () => Promise<ProfileResponse>;
  clearError: () => void;
  resetProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        profilesById: {},
        isLoading: false,
        error: null,
        uploadProgress: 0,
        workspaceRoles: workspaceRoles,
        myWork: null,

        setUser: (user) => {
          set({ user, error: null });
        },

        fetchUserProfile: async () => {
          set({ isLoading: true, error: null });
          console.log('📡 Fetching profile from API...');

          try {
            const userData = await fetchProfile();
            set({ user: userData, isLoading: false });

            if (userData?.projectSettings?.tailoredViews) {
              useProjectsStore.getState().setTailoredViews(deserializeTailoredViews(userData.projectSettings.tailoredViews));
            }

            return userData;
          } catch (error: any) {
            set({
              error: error?.response?.data?.message || 'Failed to fetch profile',
              isLoading: false,
            });
            throw error;
          }
        },

        fetchMyWork: async (days = 30) => {
          set({ isLoading: true, error: null });
          try {
            const data = await fetchMyWork(days);
            set({ myWork: data, isLoading: false });
            return data;
          } catch (error: any) {
            set({
              error: error?.response?.data?.message || 'Failed to fetch my work data',
              isLoading: false,
            });
            throw error;
          }
        },

        updateUserProfile: async (payload) => {
          set({ isLoading: true, error: null });

          try {
            console.log("Sending payload to /profile:", payload);

            const response = await updateProfile(payload);

            const currentUser = get().user;
            if (currentUser) {
              const updatedProjectSettings = payload.projectSettings
                ? { ...(currentUser.projectSettings ?? {}), ...payload.projectSettings }
                : currentUser.projectSettings;

              const updatedUser = {
                ...currentUser,
                ...payload,
                projectSettings: updatedProjectSettings,
              };

              set({
                user: {
                  ...currentUser,
                  ...payload,
                  // Deep-merge displaySettings so a partial update (e.g. only theme)
                  // doesn't wipe out other display settings (fontSize, compactMode, etc.)
                  ...(payload.displaySettings
                    ? {
                      displaySettings: {
                        ...(currentUser.displaySettings || {}),
                        ...payload.displaySettings,
                      },
                    }
                    : {}),
                },
                isLoading: false,
              });

              if (updatedProjectSettings?.tailoredViews) {
                useProjectsStore.getState().setTailoredViews(deserializeTailoredViews(updatedProjectSettings.tailoredViews));
              }
            }

            return response;
          } catch (error: any) {
            set({
              error: error?.response?.data?.message || 'Failed to update profile',
              isLoading: false,
            });
            throw error;
          }
        },

        // updateDiscussionPins: async (payload) => {
        //   set({ isLoading: true, error: null });

        //   try {
        //     console.log("📌 Updating discussion pins:", payload);

        //     const response = await updateProfile(payload);

        //     const currentUser = get().user;

        //     if (currentUser) {
        //       set({
        //         user: {
        //           ...currentUser,
        //           discussionSettings: {
        //             ...currentUser.discussionSettings,
        //             ...payload.discussionSettings,
        //           },
        //         },
        //         isLoading: false,
        //       });
        //     }

        //     return response;
        //   } catch (error: any) {
        //     set({
        //       error:
        //         error?.response?.data?.message ||
        //         "Failed to update discussion pins",
        //       isLoading: false,
        //     });
        //     throw error;
        //   }
        // },

        toggleDiscussionPin: async (
          type: DiscussionType,
          contextId: string,
          discussionId: string,
          shouldPin: boolean
        ) => {
          set({ isLoading: true, error: null });

          try {
            const payload = buildDiscussionPinPayload(
              type,
              contextId,
              shouldPin ? discussionId : ""
            );

            await updateDiscussionPins(payload);

            const currentUser = get().user;

            if (currentUser) {
              set({
                user: {
                  ...currentUser,
                  discussionSettings: {
                    ...(currentUser.discussionSettings ?? {}),
                    [type]: {
                      ...(currentUser.discussionSettings?.[type] ?? {}),
                      [contextId]: {
                        pinnedThreadId: shouldPin ? discussionId : "",
                        updatedAt: new Date().toISOString(),
                      },
                    },
                  },
                },
                isLoading: false,
              });
            } else {
              set({ isLoading: false });
            }
          } catch (error: any) {
            set({
              error:
                error?.response?.data?.message || "Failed to update discussion pins",
              isLoading: false,
            });
            throw error;
          }
        },

        uploadUserProfilePicture: async (file) => {
          set({ isLoading: true, error: null, uploadProgress: 0 });
          try {
            const response = await uploadProfilePicture(file);
            const currentUser = get().user;
            if (currentUser && response.s3Key) {
              set({
                user: { ...currentUser, profilePictureUrl: response.s3Key },
                isLoading: false,
                uploadProgress: 100,
              });
            }
            return response;
          } catch (error: any) {
            set({
              error: error?.response?.data?.message || 'Failed to upload profile picture',
              isLoading: false,
              uploadProgress: 0,
            });
            throw error;
          }
        },

        postDefaultWorkspace: async ({ workspaceId }: { workspaceId: string }) => {
          set({ isLoading: true, error: null });
          try {
            const response = await defaultWorkspace({ workspaceId });

            const currentUser = get().user;
            if (currentUser) {
              set({
                user: { ...currentUser, defaultWorkspaceId: workspaceId },
                isLoading: false,
              });
            }

            return response;
          } catch (error: any) {
            set({
              error: error?.response?.data?.message || 'Failed to make this default workspace',
              isLoading: false,
            });
            throw error;
          }
        },


        deactivateUserAccount: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await deactivateAccount();

            // Don't clear user data immediately - let the component handle it
            set({ isLoading: false });

            return response;
          } catch (error: any) {
            set({
              error: error?.response?.data?.message || 'Failed to deactivate account',
              isLoading: false,
            });
            throw error;
          }
        },

        deleteUserAccount: async () => {
          set({ isLoading: true, error: null });

          try {
            const response = await deleteAccount();

            // Clear all user data after successful deletion
            set({
              user: null,
              isLoading: false,
              uploadProgress: 0,
              error: null,
            });

            return response;
          } catch (error: any) {
            set({
              error: error?.response?.data?.message || 'Failed to delete account',
              isLoading: false,
            });
            throw error;
          }
        },


        clearError: () => {
          set({ error: null });
        },

        resetProfile: () => {
          set({ user: null, myWork: null, profilesById: {}, isLoading: false, error: null });
          localStorage.removeItem('profile-storage');
        },
      }),
      {
        name: 'profile-storage',
        partialize: (state) => ({ user: state.user }),
      }
    )
  )
);
