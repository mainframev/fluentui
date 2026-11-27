/**
 * The toaster store reports `dismissed` itself when a toast is closed through `toast.close()`, while
 * `dismissToast()` and `dismissAllToasts()` only hide the toast. This tracks which closes were already reported
 * (keyed by the store's stable `close` function) so that the container reports `dismissed` exactly once.
 * @internal
 */
const reportedCloses = new WeakSet<() => void>();

export const markDismissReported = (close: () => void): void => {
  reportedCloses.add(close);
};

/** Returns whether a dismissal was already reported for this close, and clears the mark. */
export const consumeDismissReported = (close: () => void): boolean => reportedCloses.delete(close);
