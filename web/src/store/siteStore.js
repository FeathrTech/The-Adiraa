import { create } from "zustand";

export const useSiteStore = create((set) => ({
  sites: [],

  // ✅ Replace all sites (from backend)
  setSites: (sites) => set({ sites }),

  addSite: (site) =>
    set((state) => ({
      sites: [...state.sites, site],
    })),

  updateSite: (updatedSite) =>
    set((state) => ({
      sites: state.sites.map((site) =>
        site.id === updatedSite.id ? updatedSite : site
      ),
    })),

  addHallToSite: (siteId, hall) =>
    set((state) => ({
      sites: state.sites.map((site) =>
        site.id === siteId
          ? { ...site, halls: [...(site.halls || []), hall] }
          : site
      ),
    })),
}));