"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    // Clear any in-flight timer so rapid adds restart the countdown
    if (timerRef.current) clearTimeout(timerRef.current);

    setMessage(msg);
    setVisible(true);

    timerRef.current = setTimeout(() => {
      setVisible(false);
      timerRef.current = setTimeout(() => setMessage(null), 300); // clear after exit
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast — fixed bottom-center, Onyx theme */}
      {message && (
        <div
          role="status"
          aria-live="polite"
          style={{ transitionDuration: "250ms" }}
          className={[
            "fixed bottom-8 left-1/2 -translate-x-1/2 z-[300]",
            "bg-zinc-950 text-white",
            "px-6 py-3.5 shadow-xl",
            "flex items-center gap-3",
            "transition-all ease-out",
            visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 pointer-events-none",
          ].join(" ")}
        >
          {/* Checkmark */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white shrink-0"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">
            {message}
          </p>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
