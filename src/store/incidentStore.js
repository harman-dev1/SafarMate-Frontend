import { create } from 'zustand';

export const useIncidentStore = create((set, get) => ({
  incidents: [],       // active incidents in current bbox
  selectedIncident: null,
  reportModalOpen: false,
  verifyPrompt: null,  // { incident, distMeters } for nearby active incident driver is approaching

  setIncidents: (list) => set({ incidents: list }),
  addIncident: (inc) =>
    set((s) => {
      const exists = s.incidents.some((i) => i._id === inc._id);
      return exists ? s : { incidents: [inc, ...s.incidents] };
    }),
  updateIncident: (inc) =>
    set((s) => ({
      incidents: s.incidents.map((i) => (i._id === inc._id ? inc : i)),
    })),
  removeIncident: (id) =>
    set((s) => ({
      incidents: s.incidents.filter((i) => i._id !== id),
      selectedIncident: s.selectedIncident?._id === id ? null : s.selectedIncident,
    })),

  setSelectedIncident: (inc) => set({ selectedIncident: inc }),
  openReportModal: () => set({ reportModalOpen: true }),
  closeReportModal: () => set({ reportModalOpen: false }),

  setVerifyPrompt: (data) => set({ verifyPrompt: data }),
  dismissVerifyPrompt: () => set({ verifyPrompt: null }),
}));