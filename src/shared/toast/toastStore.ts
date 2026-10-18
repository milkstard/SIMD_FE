import { create } from 'zustand';

export type ToastSeverity = 'error' | 'warning' | 'info' | 'success';

export interface Toast {
  id: number;
  message: string;
  severity: ToastSeverity;
  /** Support reference, shown for unexpected (500) errors. */
  traceId?: string | null;
}

interface ToastState {
  toast: Toast | null;
  show: (toast: Omit<Toast, 'id'>) => void;
  close: () => void;
}

let nextId = 1;

/** UI state only (CLAUDE.md): one toast at a time, a new one replaces the current. */
export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (toast) => set({ toast: { ...toast, id: nextId++ } }),
  close: () => set({ toast: null }),
}));
