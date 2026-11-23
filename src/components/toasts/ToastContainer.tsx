import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useState, type ReactElement } from "react";
import { useToast } from "../../context/toastStore";
import type { ToastType } from "../../context/toastStore";
import { TOAST_DURATION_MS } from "../../context/toastLifecycle";
import "./ToastContainer.css";

const ICONS: Record<ToastType, ReactElement> = {
  success: <CheckCircle size={20} />,
  error:   <XCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info:    <Info size={20} />,
};

function ToastProgress({ createdAt }: { createdAt: number }) {
  // Fixed at mount: parent rerenders and hover interactions never restart the
  // visual countdown or include the additional two-second dismissal grace.
  const [initialDelay] = useState(() => Math.min(0, createdAt - Date.now()));
  return <div className="toast-progress" aria-hidden="true"><span className="toast-progress-fill"
    style={{ animationDuration: `${TOAST_DURATION_MS}ms`, animationDelay: `${initialDelay}ms` }} /></div>;
}

export function ToastContainer() {
  const { toasts, dismiss, pause, resume } = useToast();

  return (
    <div className="toast-container" aria-live="polite" aria-relevant="additions">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast toast-${t.type} ${t.dismissing ? "dismissing" : ""}`}
          onPointerEnter={event => { if (event.pointerType !== "touch") pause(t.id, "pointer"); }}
          onPointerLeave={event => { if (event.pointerType !== "touch") resume(t.id, "pointer"); }}
          onFocusCapture={() => pause(t.id, "focus")}
          onBlurCapture={event => {
            if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) resume(t.id, "focus");
          }}
        >
          <div className="toast-content">
            <div className="toast-header">
              <span className="toast-icon" aria-hidden="true">{ICONS[t.type]}</span>
              <div className="toast-heading"><span className="toast-title">{t.title}</span>
                {t.badge && <span className="toast-badge">{t.badge}</span>}</div>
              <button className="toast-close" aria-label="Cerrar notificación" onClick={() => dismiss(t.id)}>
                <X size={17} aria-hidden="true" />
              </button>
            </div>
            {t.description && <p className="toast-description">{t.description}</p>}
            {t.details && t.details.length > 0 && <dl className="toast-details">
              {t.details.map((detail, index) => <div className="toast-detail" key={`${detail.label}-${index}`}>
                <dt>{detail.label}</dt><dd>{detail.value}</dd>
              </div>)}
            </dl>}
          </div>
          <ToastProgress createdAt={t.createdAt} />
        </div>
      ))}
    </div>
  );
}
