import { createPortal } from "react-dom";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
} from "lucide-react";
import { useToastStore } from "../../store/useToastStore";
import type { Toast as ToastType } from "../../store/useToastStore";

const TOAST_STYLES: Record<
  ToastType["type"],
  { bg: string; border: string; icon: React.ReactNode; color: string }
> = {
  success: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    icon: <CheckCircle2 size={18} />,
    color: "text-emerald-400",
  },
  error: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/25",
    icon: <XCircle size={18} />,
    color: "text-rose-400",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    icon: <AlertTriangle size={18} />,
    color: "text-amber-400",
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    icon: <Info size={18} />,
    color: "text-blue-400",
  },
};

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const style = TOAST_STYLES[toast.type];

  return (
    <div
      className={`${style.bg} ${style.border} border rounded-xl p-3.5 pr-10 shadow-2xl backdrop-blur-md animate-slide-up relative flex items-start gap-3 max-w-sm w-full`}
    >
      <span className={`${style.color} flex-shrink-0 mt-0.5`}>
        {style.icon}
      </span>
      <p className="text-sm text-white/90 leading-relaxed">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="absolute top-2.5 right-2.5 p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-auto"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body,
  );
}
