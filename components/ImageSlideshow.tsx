"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  homeId: number;
  className?: string;
}

export function ImageSlideshow({ homeId, className = "" }: Props) {
  const [imageIds, setImageIds] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`/api/homes/${homeId}/images`)
      .then((r) => r.json())
      .then((d) => {
        setImageIds((d.images ?? []).map((i: { id: number }) => i.id));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [homeId]);

  const restartTimer = useCallback(
    (length: number) => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (length <= 1) return;
      timerRef.current = setInterval(
        () => setCurrent((c) => (c + 1) % length),
        4000
      );
    },
    []
  );

  useEffect(() => {
    restartTimer(imageIds.length);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [imageIds.length, restartTimer]);

  const go = useCallback(
    (dir: 1 | -1) => {
      setCurrent((c) => (c + dir + imageIds.length) % imageIds.length);
      restartTimer(imageIds.length);
    },
    [imageIds.length, restartTimer]
  );

  if (!loaded) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-palm-100 ${className}`}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-palm-700 border-t-transparent" />
      </div>
    );
  }

  if (imageIds.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-palm-100/60 text-sm text-ink/35 ${className}`}
      >
        No photos yet
      </div>
    );
  }

  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-black ${className}`}>
      {/* Slide */}
      <img
        key={imageIds[current]}
        src={`/api/images/${imageIds[current]}`}
        alt={`Home photo ${current + 1}`}
        className="h-full w-full object-cover"
      />

      {/* Prev / Next */}
      {imageIds.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-xl text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 hover:bg-black/60"
          >
            ‹
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-xl text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 hover:bg-black/60"
          >
            ›
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {imageIds.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrent(i);
                  restartTimer(imageIds.length);
                }}
                aria-label={`Go to photo ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === current ? "w-5 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
