export type ToastPauseReason = "pointer" | "focus";
export const TOAST_DURATION_MS = 6000;
type TimerHandle = ReturnType<typeof setTimeout>;

interface ToastClock {
  now: () => number;
  setTimeout: (callback: () => void, delay: number) => TimerHandle;
  clearTimeout: (handle: TimerHandle) => void;
}

interface ToastTimer {
  deadline: number;
  holds: Set<ToastPauseReason>;
  closing: boolean;
  closeTimer?: TimerHandle;
  removeTimer?: TimerHandle;
}

const defaultClock: ToastClock = {
  now: () => Date.now(),
  setTimeout: (callback, delay) => setTimeout(callback, delay),
  clearTimeout: handle => clearTimeout(handle),
};

export function createToastLifecycle(
  callbacks: { onDismiss: (id: string) => void; onRemove: (id: string) => void },
  clock: ToastClock = defaultClock,
) {
  const timers = new Map<string, ToastTimer>();

  function cancelClose(timer: ToastTimer) {
    if (timer.closeTimer !== undefined) clock.clearTimeout(timer.closeTimer);
    timer.closeTimer = undefined;
  }

  function dismiss(id: string) {
    const timer = timers.get(id);
    if (!timer || timer.closing) return;
    timer.closing = true;
    cancelClose(timer);
    callbacks.onDismiss(id);
    timer.removeTimer = clock.setTimeout(() => {
      timers.delete(id);
      callbacks.onRemove(id);
    }, 350);
  }

  function scheduleClose(id: string, timer: ToastTimer, delay: number) {
    cancelClose(timer);
    timer.closeTimer = clock.setTimeout(() => dismiss(id), delay);
  }

  return {
    start(id: string) {
      if (timers.has(id)) return;
      const timer: ToastTimer = { deadline: clock.now() + TOAST_DURATION_MS, holds: new Set(), closing: false };
      timers.set(id, timer);
      scheduleClose(id, timer, TOAST_DURATION_MS);
    },
    dismiss,
    pause(id: string, reason: ToastPauseReason) {
      const timer = timers.get(id);
      if (!timer || timer.closing) return;
      timer.holds.add(reason);
      cancelClose(timer);
    },
    resume(id: string, reason: ToastPauseReason) {
      const timer = timers.get(id);
      if (!timer || timer.closing || !timer.holds.delete(reason) || timer.holds.size) return;
      // Preserve the original six-second minimum, then allow at least two
      // seconds after the last pointer/focus interaction. Re-entry cancels it.
      scheduleClose(id, timer, Math.max(timer.deadline - clock.now(), 2000));
    },
    dispose() {
      timers.forEach(timer => {
        cancelClose(timer);
        if (timer.removeTimer !== undefined) clock.clearTimeout(timer.removeTimer);
      });
      timers.clear();
    },
  };
}
