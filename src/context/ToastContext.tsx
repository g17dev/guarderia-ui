import { useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { createToastLifecycle } from "./toastLifecycle";
import { ToastContext } from "./toastStore";
import type { Toast, ToastType, ToastOptions } from "./toastStore";

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [lifecycle] = useState(() => createToastLifecycle({
    onDismiss: id => setToasts(prev => prev.map(t => t.id === id ? { ...t, dismissing: true } : t)),
    onRemove: id => setToasts(prev => prev.filter(t => t.id !== id)),
  }));

  useEffect(() => () => lifecycle.dispose(), [lifecycle]);

  const toast = useCallback((type: ToastType, title: string, description?: string, options?: ToastOptions) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, {
      id, type, title, description, details: options?.details, badge: options?.badge, createdAt: Date.now(),
    }]);
    lifecycle.start(id);
  }, [lifecycle]);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss: lifecycle.dismiss, pause: lifecycle.pause, resume: lifecycle.resume }}>
      {children}
    </ToastContext.Provider>
  );
}
