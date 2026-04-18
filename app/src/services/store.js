import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useUserStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      
      logout: () => set({ token: null, user: null }),
      
      isLoggedIn: () => !!get().token,
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const useProjectStore = create((set) => ({
  currentProject: null,
  projects: [],
  
  setCurrentProject: (project) => set({ currentProject: project }),
  setProjects: (projects) => set({ projects }),
  
  updateProjectConfig: (config) => set((state) => ({
    currentProject: state.currentProject 
      ? { ...state.currentProject, config }
      : null
  })),
}));
