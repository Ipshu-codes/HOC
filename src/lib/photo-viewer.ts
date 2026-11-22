import { useEffect, useSyncExternalStore } from "react";

/**
 * Whether a photograph is open anywhere on the page: the museum's close-up card or the gallery's
 * PhotoView. Nani (the chatbot) is only shown while one is. A tiny shared counter rather than a React
 * context, because the viewers and the chatbot live in separate parts of the layout.
 */
let openViewers = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Call in a photo viewer: counts it as open while `open` is true (and it is mounted). */
export function usePhotoViewerOpen(open: boolean): void {
  useEffect(() => {
    if (!open) return;
    openViewers += 1;
    emit();
    return () => {
      openViewers -= 1;
      emit();
    };
  }, [open]);
}

/** True while any photo viewer is open. */
export function usePhotoViewerShown(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => openViewers > 0,
    () => false,
  );
}

/** Nani and her chat sit inside this element; her own button is its first child. */
export const PHOTO_COMPANION = "[data-photo-companion]";
export const PHOTO_COMPANION_BUTTON = `${PHOTO_COMPANION} > button`;

/** A key pressed inside Nani's open chat belongs to the chat; on her button it still works the viewer. */
export function inPhotoChat(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(PHOTO_COMPANION)) && !target.matches(PHOTO_COMPANION_BUTTON);
}
