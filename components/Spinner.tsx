import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
        className || "h-4 w-4"
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

/** Full-screen overlay loader used during page-level async work. */
export function FullScreenLoader({ label = "Just a moment…" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-jasmine-100/80 backdrop-blur-sm">
      <Spinner className="h-9 w-9 text-palm-700" />
      <p className="text-sm font-medium text-palm-800">{label}</p>
    </div>
  );
}
