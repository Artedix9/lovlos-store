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
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

    setMessage(msg);
    setVisible(true);

    timerRef.current = setTimeout(() => {
      setVisible(false);
      fadeTimerRef.current = setTimeout(() => setMessage(null), 300);
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {message && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{ transitionDuration: "250ms" }}
          className={[
            "fixed bottom-8 left-1/2 -translate-x-1/2 z-[300]",
            "bg-primary text-white",
            "px-5 py-3 shadow-level-3 max-w-xs w-max",
            "flex items-center gap-2.5",
            "transition-all ease-out",
            visible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 pointer-events-none",
          ].join(" ")}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white/70 shrink-0"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p className="text-xs tracking-wide leading-snug">{message}</p>
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
