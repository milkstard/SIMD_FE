import { create } from 'zustand';

// UI state only: whether the silent token refresh gave up and the user must sign in again.
interface SessionState {
  expired: boolean;
  markExpired: () => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  expired: false,
  markExpired: () => set({ expired: true }),
  reset: () => set({ expired: false }),
}));
