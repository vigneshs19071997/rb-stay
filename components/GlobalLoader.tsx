"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface LoadingCtxType {
  push: () => void;
  pop: () => void;
}
const LoadingCtx = createContext<LoadingCtxType>({ push: () => {}, pop: () => {} });

export function GlobalLoaderProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);

  // Intercept window.fetch — every API call automatically triggers the loader
  useEffect(() => {
    const original = window.fetch;
    window.fetch = async function (...args: Parameters<typeof fetch>) {
      setCount((c) => c + 1);
      try {
        return await original.apply(this, args);
      } finally {
        setCount((c) => Math.max(0, c - 1));
      }
    };
    return () => {
      window.fetch = original;
    };
  }, []);

  const push = useCallback(() => setCount((c) => c + 1), []);
  const pop  = useCallback(() => setCount((c) => Math.max(0, c - 1)), []);

  return (
    <LoadingCtx.Provider value={{ push, pop }}>
      {count > 0 && <FullScreenLoader />}
      {children}
    </LoadingCtx.Provider>
  );
}

export function useLoadingBar() {
  return useContext(LoadingCtx);
}

function FullScreenLoader() {
  return (
    <div className="loader-overlay" role="status" aria-label="Loading">
      <div className="loader-card">
        {/* Brand badge */}
        <div className="loader-brand">
          <span className="loader-brand-rb">RB</span>
          <span className="loader-brand-name">Comfort Stay</span>
        </div>

        {/* Animated rings */}
        <div className="loader-rings">
          <div className="loader-ring-outer" />
          <div className="loader-ring-inner" />
          <div className="loader-ring-dot" />
        </div>

        {/* Status text */}
        <p className="loader-label">Please wait…</p>
      </div>
    </div>
  );
}
