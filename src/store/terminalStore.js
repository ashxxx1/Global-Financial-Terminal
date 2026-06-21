import { create } from "zustand";

const useTerminalStore = create((set) => ({
  selectedCountry: null,
  isNewsPanelOpen: false,
  globeAutoRotate: true,

  setSelectedCountry: (country) =>
    set({ selectedCountry: country, isNewsPanelOpen: !!country }),

  closeNewsPanel: () =>
    set({ isNewsPanelOpen: false, selectedCountry: null }),

  setGlobeAutoRotate: (val) => set({ globeAutoRotate: val }),
}));

export default useTerminalStore;
