import { create } from 'zustand';

/**
 * Ekibim tab'ından harita tab'ına görev konumu aktarmak için kullanılır.
 * Team screen görev konumunu buraya yazar, Map screen okuyup rotayı başlatır.
 */
export interface PendingTaskNav {
  latitude: number;
  longitude: number;
  taskId: string;
  taskDescription?: string;
}

interface MapStore {
  pendingTaskNav: PendingTaskNav | null;
  setPendingTaskNav: (nav: PendingTaskNav | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  pendingTaskNav: null,
  setPendingTaskNav: (nav) => set({ pendingTaskNav: nav }),
}));
