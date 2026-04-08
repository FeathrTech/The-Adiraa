// store/uiStore.js
import { create } from "zustand";

export const useUIStore = create((set) => ({
  loading: false,
  setLoading: (val) => set({ loading: val }),
}));
