import { create } from 'zustand';

interface ApiErrorNoticeState {
  message: string | null;
  show: (message: string) => void;
  dismiss: () => void;
}

export const useApiErrorNotice = create<ApiErrorNoticeState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  dismiss: () => set({ message: null }),
}));
