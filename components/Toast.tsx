"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ToastKind = "success" | "error" | "info";

interface PopupItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (m: string) => void;
  error:   (m: string) => void;
  info:    (m: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<PopupItem[]>([]);
  const current = queue[0] ?? null;

  const push = useCallback((kind: ToastKind, message: string) => {
    setQueue((q) => [...q, { id: Date.now() + Math.random(), kind, message }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setQueue((q) => q.filter((x) => x.id !== id));
  }, []);

  // Memoize so the object reference stays stable between renders.
  // Without this, every queue update creates a new api object, changing the
  // `toast` reference in consumers and re-triggering any effects that list it
  // as a dependency (e.g. homes/availability loaders in the book page).
  const api = useMemo<ToastApi>(() => ({
    success: (m) => push("success", m),
    error:   (m) => push("error", m),
    info:    (m) => push("info", m),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {current && (
        <Popup key={current.id} item={current} onClose={() => dismiss(current.id)} />
      )}
    </ToastContext.Provider>
  );
}

/* ─── per-kind visual config ─── */
const KIND: Record<ToastKind, {
  title: string;
  autoDismissMs: number | null;
  circleBg: string;
  btnBg: string;
  btnBgHover: string;
  btnColor: string;
  Icon: () => JSX.Element;
}> = {
  success: {
    title: "Success",
    autoDismissMs: 3000,
    circleBg: "#143f35",
    btnBg: "#0e3b33",
    btnBgHover: "#143f35",
    btnColor: "#fdfbf6",
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" style={{ width: 36, height: 36 }}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  error: {
    title: "Oops!",
    autoDismissMs: null,   // errors stay until dismissed
    circleBg: "#dc2626",
    btnBg: "#b91c1c",
    btnBgHover: "#dc2626",
    btnColor: "#ffffff",
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" style={{ width: 36, height: 36 }}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8"  x2="12"    y2="13" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  info: {
    title: "Info",
    autoDismissMs: 4000,
    circleBg: "#d89b3a",
    btnBg: "#d89b3a",
    btnBgHover: "#c5862a",
    btnColor: "#0a2c26",
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" style={{ width: 36, height: 36 }}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12"    y2="12" />
        <line x1="12" y1="8"  x2="12.01" y2="8"  />
      </svg>
    ),
  },
};

function Popup({ item, onClose }: { item: PopupItem; onClose: () => void }) {
  const cfg = KIND[item.kind];

  // Auto-dismiss (success / info only)
  useEffect(() => {
    if (!cfg.autoDismissMs) return;
    const t = setTimeout(onClose, cfg.autoDismissMs);
    return () => clearTimeout(t);
  }, [cfg.autoDismissMs, onClose]);

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div
      className="popup-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-live="assertive"
    >
      <div className="popup-card">
        {/* Icon circle */}
        <div className="popup-icon-wrap" style={{ background: cfg.circleBg }}>
          <cfg.Icon />
        </div>

        {/* Text */}
        <h3 className="popup-title">{cfg.title}</h3>
        <p className="popup-msg">{item.message}</p>

        {/* OK button */}
        <button
          className="popup-btn"
          autoFocus
          onClick={onClose}
          style={{ background: cfg.btnBg, color: cfg.btnColor }}
          onMouseEnter={(e) => (e.currentTarget.style.background = cfg.btnBgHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = cfg.btnBg)}
        >
          OK
        </button>
      </div>
    </div>
  );
}
