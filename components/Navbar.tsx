"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    toast.success("Signed out.");
    router.push("/");
    setOpen(false);
  }

  const links =
    user?.role === "admin"
      ? [{ href: "/admin", label: "Admin dashboard" }]
      : user
      ? [
          { href: "/login", label: "Book a stay" },
          { href: "/my-bookings", label: "My bookings" },
          { href: "/profile", label: "My profile" },
        ]
      : [{ href: "/login", label: "Book a stay" }];

  return (
    <header className="sticky top-0 z-40 border-b border-palm-800/10 bg-jasmine-100/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-3.5">
        {/* Brand — pushed to the far left */}
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-palm-700 to-palm-900 shadow-soft">
            <span className="font-display text-lg font-bold tracking-wide text-marigold-400">RB</span>
            <span className="absolute -inset-px rounded-xl ring-1 ring-marigold-400/30" />
          </span>
          <div className="leading-none">
            <span className="block font-display text-[2rem] tracking-tight text-palm-900">
              RB{" "}
              <span style={{ color: "rgb(216 155 58)" }} className="italic">
                Comfort Stay
              </span>
            </span>
            <span className="mt-0.5 block text-[10px] font-sans font-semibold uppercase tracking-[0.22em] text-ink/40">
              Vellore, Tamil Nadu
            </span>
          </div>
        </Link>

        {/* Hamburger */}
        <button
          className="rounded-lg p-2 text-palm-800 md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
          <span className="mt-1 block h-0.5 w-5 bg-current" />
        </button>

        {/* Desktop nav */}
        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-palm-800/80 transition hover:text-palm-900"
            >
              {l.label}
            </Link>
          ))}
          {loading ? null : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-ink/60">Hi, {user.name.split(" ")[0]}</span>
              <button onClick={handleLogout} className="btn-ghost px-4 py-2">Sign out</button>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn px-5 py-2.5 font-semibold text-palm-900"
              style={{ backgroundColor: "rgb(216 155 58)" }}
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-palm-800/10 bg-jasmine-100 px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-1 text-sm font-medium text-palm-800"
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <button onClick={handleLogout} className="btn-ghost mt-1 w-full">Sign out</button>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="btn mt-1 w-full font-semibold text-palm-900"
                style={{ backgroundColor: "rgb(216 155 58)" }}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
