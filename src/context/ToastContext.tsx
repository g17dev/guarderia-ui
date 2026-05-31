import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  dismissing?: boolean;  // ← nuevo
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (type: ToastType, title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    // Marca el toast como "saliendo" para disparar la animación
    setToasts(prev =>
        prev.map(t => t.id === id ? { ...t, dismissing: true } : t)
    );
    // Después de que termina la animación lo elimina del DOM
    setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, 350);
  }, []);

  const toast = useCallback((type: ToastType, title: string, description?: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, title, description }]);
    setTimeout(() => dismiss(id), 6000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}