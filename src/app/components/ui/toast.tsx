import { useSyncExternalStore } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "./utils";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

let toasts: ToastItem[] = [];
let listeners: Array<() => void> = [];
let nextId = 1;

function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  return toasts;
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emitChange();
}

function push(message: string, variant: ToastVariant) {
  const id = nextId++;
  toasts = [...toasts, { id, message, variant }];
  emitChange();
  setTimeout(() => dismiss(id), 4000);
}

export const toast = {
  success: (message: string) => push(message, "success"),
  error: (message: string) => push(message, "error"),
  info: (message: string) => push(message, "info"),
};

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; iconClass: string; borderClass: string }
> = {
  success: { icon: CheckCircle2, iconClass: "text-emerald-600", borderClass: "border-l-emerald-500" },
  error: { icon: XCircle, iconClass: "text-red-600", borderClass: "border-l-red-500" },
  info: { icon: Info, iconClass: "text-blue-600", borderClass: "border-l-blue-500" },
};

export function Toaster() {
  const items = useSyncExternalStore(subscribe, getSnapshot);

  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 w-full max-w-sm px-4 pointer-events-none">
      {items.map((item) => {
        const { icon: Icon, iconClass, borderClass } = VARIANT_STYLES[item.variant];
        return (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 w-full bg-white rounded-lg shadow-lg border border-slate-200 border-l-4 p-4 animate-in fade-in slide-in-from-top-2 duration-300",
              borderClass
            )}
          >
            <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", iconClass)} />
            <p className="text-sm text-slate-700 flex-1">{item.message}</p>
            <button
              onClick={() => dismiss(item.id)}
              className="text-slate-400 hover:text-slate-600 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
