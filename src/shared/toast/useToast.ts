import { useToastStore } from './toastStore';

export function useToast() {
  return useToastStore((state) => state.show);
}
