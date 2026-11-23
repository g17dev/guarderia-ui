import { createContext, useContext } from "react";
import type { ToastPauseReason } from "./toastLifecycle";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastDetail {
  label: string;
  value: string;
}

export interface ToastOptions {
  details?: ToastDetail[];
  badge?: string;
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  details?: ToastDetail[];
  badge?: string;
  createdAt: number;
  dismissing?: boolean;
}

export interface ToastContextValue {
  toasts: Toast[];
  toast: (type: ToastType, title: string, description?: string, options?: ToastOptions) => void;
  dismiss: (id: string) => void;
  pause: (id: string, reason: ToastPauseReason) => void;
  resume: (id: string, reason: ToastPauseReason) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);


export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}
