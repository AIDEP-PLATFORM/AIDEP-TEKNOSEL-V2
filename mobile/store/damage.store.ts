import { create } from 'zustand';
import { DamageReport } from '@/types/damage.types';

interface DamageState {
  reports: DamageReport[];
  selectedReport: DamageReport | null;
  isLoading: boolean;
  setReports: (reports: DamageReport[]) => void;
  addReport: (report: DamageReport) => void;
  selectReport: (report: DamageReport | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useDamageStore = create<DamageState>((set) => ({
  reports: [],
  selectedReport: null,
  isLoading: false,

  setReports: (reports) => set({ reports }),
  addReport: (report) => set((state) => ({ reports: [report, ...state.reports] })),
  selectReport: (report) => set({ selectedReport: report }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
