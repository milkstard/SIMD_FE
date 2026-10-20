import { useCallback, useEffect, useRef, useState } from 'react';

/** Never shorter than this, so a small window scrolls the page instead of squeezing the grid. */
export const MIN_FILL_HEIGHT = 360;

/** Room kept below the element for the page padding and the list footer. */
const BOTTOM_RESERVE = 72;

/** Pure so it can be tested without a layout engine. */
export function fillHeight(viewportHeight: number, top: number): number {
  return Math.max(MIN_FILL_HEIGHT, Math.floor(viewportHeight - top - BOTTOM_RESERVE));
}

/**
 * Height that fills the viewport below the element. It follows window resizes and anything above the
 * element that changes the page height (a wrapping filter bar, an alert), so no header height is hard-coded.
 */
export function useFillViewportHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState(MIN_FILL_HEIGHT);

  const measure = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    setHeight(fillHeight(window.innerHeight, element.getBoundingClientRect().top + window.scrollY));
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(document.body);
    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [measure]);

  return { ref, height };
}
