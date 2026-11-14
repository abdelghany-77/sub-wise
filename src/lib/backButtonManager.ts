type BackHandler = () => boolean;

const backHandlers: BackHandler[] = [];

/**
 * Register a back button handler. Handlers are evaluated in LIFO (last-in, first-out) order.
 * Return `true` if the event was handled and propagation should stop.
 * Returns an unregister function.
 */
export function registerBackHandler(handler: BackHandler): () => void {
  backHandlers.push(handler);
  return () => {
    const idx = backHandlers.indexOf(handler);
    if (idx !== -1) {
      backHandlers.splice(idx, 1);
    }
  };
}

/**
 * Executes the topmost back button handler. Returns true if handled.
 */
export function handleHardwareBack(): boolean {
  for (let i = backHandlers.length - 1; i >= 0; i--) {
    try {
      const handled = backHandlers[i]();
      if (handled) return true;
    } catch (err) {
      console.warn("Back handler error:", err);
    }
  }
  return false;
}
