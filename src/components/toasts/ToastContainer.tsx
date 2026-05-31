import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { type ReactElement } from "react";
import { useToast } from "../../context/ToastContext";
import type { ToastType } from "../../context/ToastContext";
import "./ToastContainer.css";

const ICONS: Record<ToastType, ReactElement> = {
  success: <CheckCircle size={22} />,
  error:   <XCircle size={22} />,
  warning: <AlertTriangle size={22} />,
  info:    <Info size={22} />,
};

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast toast-${t.type} ${t.dismissing ? "dismissing" : ""}`}
        >
          <span className="toast-icon">{ICONS[t.type]}</span>
          <div className="toast-body">
            <span className="toast-title">{t.title}</span>
            {t.description && (
              <span className="toast-description">{t.description}</span>
            )}
          </div>
          <button className="toast-close" onClick={() => dismiss(t.id)}>
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}