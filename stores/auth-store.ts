import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axiosInstance from '@/lib/api/axios-instance';
import axios from 'axios';
import type { AuthState } from '@/types/auth.types';

import {
  loginRequestSchema,
  registerRequestSchema,
  verifyOtpRequestSchema,
} from '@/schemas/auth-schema';
import { useWorkspaceStore } from './workspace-store';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      token: null,
      isAuthenticated: false,
      user: null,
      isLoading: false,
      isQuestionnaireCompleted: false,
      isHydrated: false,
      signupEmail: null,
      setSignupEmail: (email) => set({ signupEmail: email }),

      // State actions
      setCredentials: ({ token, user }) => {
        set((state) => {
          // If a new user object is provided, we should default the onboarding status 
          // to false if it's not present, to prevent stale redirects from localStorage.
          const newIsQuestionnaireCompleted = user
            ? (user.isQuestionnaireCompleted ?? false)
            : state.isQuestionnaireCompleted;

          return {
            token: token || state.token,
            isAuthenticated: true,
            user: user ? { ...state.user, ...user } : state.user,
            isQuestionnaireCompleted: newIsQuestionnaireCompleted,
          };
        });

        if (token) {
          document.cookie = `authToken=${token}; path=/; max-age=2592000; SameSite=Lax`;
        }
      },

      // updateUser: (userData) => {
      //   set((state) => ({
      //     user: state.user ? { ...state.user, ...userData } : null,
      //     isOnboardingCompleted: userData.isOnboardingCompleted || state.isOnboardingCompleted,
      //   }));
      // },

      clearCredentials: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('auth-storage');
        //Remove cookie
        document.cookie = 'authToken=; path=/; expires=Thu, 01 JAn 1970 00:00:01 GMT;';
        set({
          token: null,
          isAuthenticated: false,
          user: null,
          isLoading: false,
          isQuestionnaireCompleted: false,
          signupEmail: null,
        });
      },

      reset: () => {
        get().clearCredentials();
      },

      login: async (credentials) => {
        console.log('Email being validated:', credentials.email);
        const result = loginRequestSchema.safeParse(credentials);

        if (!result.success) {
          console.log('Validation error:', result.error.issues);
          throw new Error('Invalid email format');
        }

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
          result.data
        );

        return response.data;
      },

      register: async (userData) => {
        const validatedData = registerRequestSchema.parse(userData);
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
          validatedData
        );
        return response.data;
      },

      // Update your verifyOtp method in auth-store.ts
      verifyOtp: async (verificationData) => {
        try {
          const validatedData = verifyOtpRequestSchema.parse(verificationData);
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`,
            validatedData
          );
          const result = response.data;

          if (result.token) {
            const decodedToken = JSON.parse(
              atob(result.token.split('.')[1])
            );

            set({
              token: result.token,
              isAuthenticated: true,
              user: {
                id: decodedToken.userId,
                email: decodedToken.email,
                name: decodedToken.name || verificationData.email,
                provider: 'local',
                isExistingUser: result.isOnboarded || false,
                refreshToken: result.refreshToken, // Store refresh token
              },
            });

            document.cookie = `authToken=${result.token}; path=/; max-age=2592000; SameSite=Lax`;

            return result;
          }
        } catch (error: any) {
          // Handle axios errors in the store and throw meaningful messages
          if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            const message = error.response?.data?.message;

            switch (status) {
              case 400:
                throw new Error(message || "Invalid OTP. Please check and try again.");
              case 401:
                throw new Error("OTP has expired. Please request a new code.");
              case 429:
                throw new Error("Too many attempts. Please wait before trying again.");
              default:
                throw new Error(message || "OTP verification failed. Please try again.");
            }
          } else {
            throw new Error("Network error. Please check your connection.");
          }
        }
      },

      checkUserAuth: async (tokenParam?: string) => {
        const tokenToUse = tokenParam ?? get().token;
        if (!tokenToUse) throw new Error("No auth token available");

        console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
        console.log("Token being used:", tokenToUse);


        const result: any = await axiosInstance.post(
          `/auth/check-user-auth`,
          {}
        );

        const { isQuestionnaireCompleted } = result;
        set((state) => ({
          isQuestionnaireCompleted,
          user: state.user ? { ...state.user, isQuestionnaireCompleted } : state.user
        }));

        return result;
      },

      refreshToken: async (data) => {
        try {
          const state = get();

          // Use the stored refresh token from user object if it exists, otherwise fall back to state.token
          const refreshTokenValue = state.user?.refreshToken || state.token;

          if (!refreshTokenValue) {
            throw new Error("Missing token or refresh token");
          }

          const body = {
            refreshToken: refreshTokenValue,
            ...data,
          };

          // axiosInstance returns response.data directly due to interceptor
          const result = await axiosInstance.post(
            `/auth/refresh-token`,
            body
          );

          // Update token + refreshToken in state
          if (result && result.token) {
            set((prev) => {
              if (!prev.user) return prev;

              return {
                token: result.token,
                user: {
                  ...prev.user,
                  refreshToken: result.refreshToken,
                },
              };
            });
            document.cookie = `authToken=${result.token}; path=/; max-age=2592000; SameSite=Lax`;
          }

          return result;
        } catch (error: any) {
          if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.message || "Token refresh failed");
          }
          // Log the actual error to help debugging
          console.error("Critical error during token refresh:", error);
          throw new Error(error.message || "Network error during token refresh");
        }
      },

      // Add to the store state/actions
      getSessions: async () => {
        const response = await axiosInstance.get(
          `/auth/sessions`
        );
        return response;
      },

      getSessionById: async (sessionId: string) => {
        const response = await axiosInstance.get(
          `/auth/sessions/${sessionId}`
        );
        return response;
      },
      terminateSession: async (sessionId: string) => {
        const response = await axiosInstance.delete(
          `/auth/sessions/${sessionId}`
        );
        return response;
      },

      terminateOtherSessions: async () => {
        const response = await axiosInstance.delete(
          `/auth/sessions/all/other`
        );
        return response;
      },

      logout: async () => {
        const response = await axiosInstance.post(
          `/auth/logout`,
          {}
        );
        return response;
      },

      switchWorkspace: async (workspaceId: string) => {
        const response = await axiosInstance.post(
          `/profile/workspaces/switch`,
          { workspaceId }
        );

        const result = response;

        //Update token
        if (result.token) {
          set({
            token: result.token,
          });
          document.cookie = `authToken=${result.token}; path=/; max-age=2592000; SameSite=Lax`;
        }

        const workspaceStore = useWorkspaceStore.getState();
        const workspaceToSet = workspaceStore.workspaces.find(
          ws => ws.id === workspaceId
        );

        if (workspaceToSet) {
          useWorkspaceStore.setState({
            currentWorkspace: workspaceToSet,
          });
        }

        return result;
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        // signupEmail: state.signupEmail,
      }),

      // Add hydration hook
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Mark as hydrated after rehydration
          state.isHydrated = true;
        }
      },
    }
  )
);
