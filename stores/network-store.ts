import { create } from 'zustand';

interface NetworkState {
  isOnline: boolean;
  setIsOnline: (isOnline: boolean) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: true,
  setIsOnline: (isOnline) => set({ isOnline }),
}));
