// store/favorites-store.ts

import { create } from 'zustand';
import axios from 'axios';

export interface Favorite {
  id: string;
  name: string;
  href: string;
  type?: 'page' | 'project' | 'tool' | 'report';
}

interface FavoritesState {
  favorites: Favorite[];
  isLoading: boolean;
  error: string | null;
  
  fetchFavorites: () => Promise<void>;
  addFavorite: (favorite: Favorite) => void;
  removeFavorite: (id: string) => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  isLoading: false,
  error: null,

  fetchFavorites: async () => {
    set({ isLoading: true, error: null });
    try {
      // Use dummy data in development
    //   if (process.env.NODE_ENV === 'development') {
        const mockFavorites: Favorite[] = [
          { id: '1', name: 'Dashboard Overview', href: '/dashboard', type: 'page' },
          { id: '2', name: 'Sprint Planning', href: '/project/1', type: 'project' },
          { id: '3', name: 'Team Calendar', href: '/teams/1/calendar', type: 'tool' },
          { id: '4', name: 'Analytics Report', href: '/reports/analytics', type: 'report' },
        ];
        
        await new Promise(resolve => setTimeout(resolve, 500));
        set({ favorites: mockFavorites, isLoading: false });
        return;
    //   }

    //   const response = await axios.get(
    //     `${process.env.NEXT_PUBLIC_API_URL}/favorites`
    //   );
    //   set({ favorites: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch favorites', 
        isLoading: false 
      });
    }
  },

  addFavorite: (favorite) => {
    set((state) => ({
      favorites: [...state.favorites, favorite],
    }));
  },

  removeFavorite: (id) => {
    set((state) => ({
      favorites: state.favorites.filter((fav) => fav.id !== id),
    }));
  },
}));
