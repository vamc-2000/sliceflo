// stores/user-store.ts
import { create } from 'zustand';
import axios from 'axios';
import type { User, ProfileResponse } from '@/types/user.types';

interface UserState {
  currentUser: User | null;
  selectedUser: User | null;
  isLoading: boolean;
  error: string | null;

  // User Actions
  getCurrentUser: () => Promise<ProfileResponse>;
  updateCurrentUser: (data: Partial<User>) => Promise<ProfileResponse>;
  getUserById: (id: string) => Promise<ProfileResponse>;
  sendEmail: (data: { to: string; subject: string; message: string }) => Promise<{ success: boolean; message: string }>;
  sendOtp: (email: string) => Promise<{ success: boolean; message: string }>;

  // State Actions
  setCurrentUser: (user: User) => void;
  setSelectedUser: (user: User | null) => void;
  clearUser: () => void;
  reset: () => void;
}

const getAuthToken = () => {
  const token = localStorage.getItem('auth-storage');
  const authData = token ? JSON.parse(token) : null;
  return authData?.state?.token;
};

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  selectedUser: null,
  isLoading: false,
  error: null,

  // Get Current User (me)
  getCurrentUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );
      set({ currentUser: response.data.user, isLoading: false });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch current user';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  // Update Current User
  updateCurrentUser: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
        data,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );
      set({ currentUser: response.data.user, isLoading: false });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update current user';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  // Get User by ID
  getUserById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${id}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );
      set({ selectedUser: response.data.user, isLoading: false });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch user';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  // Send Email
  sendEmail: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/send-email`,
        data,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );
      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send email';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  // Send OTP
  sendOtp: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/users/send-otp`,
        { email },
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );
      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send OTP';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  // State Actions
  setCurrentUser: (user) => set({ currentUser: user }),
  setSelectedUser: (user) => set({ selectedUser: user }),
  clearUser: () => set({ currentUser: null, selectedUser: null, error: null }),
  reset: () => {},
}));
