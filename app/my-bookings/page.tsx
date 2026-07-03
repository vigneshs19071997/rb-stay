"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";
import { useToast } from "@/components/Toast";
import { prettyDate } from "@/lib/utils";
import { getRoomType } from "@/lib/constants";

function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

interface Booking {
  id: number;
  homeName: string;
  checkIn: string;
  checkOut: string;
  numDays: number;
  numMembers: number;
  status: "confirmed" | "cancelled";
  roomType: string;
  pricePerNight: number;
  totalPrice: number;
}

export default function MyBookingsPage() {
  const toast = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", { cache: "no-store" });
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch {
      toast.error("Could not load your bookings.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function cancel() {
    if (!cancelTarget) return;
    setWorking(true);
    try {
      const res = await fetch(`/api/bookings/${cancelTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!res.ok) throw new Error("Could not cancel the booking.");
      toast.success("Booking cancelled.");
      setCancelTarget(null);
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Your trips</p>
          <h1 className="mt-2 text-3xl text-palm-900">My bookings</h1>
        </div>
        <Link href="/book" className="btn-accent">Book a stay</Link>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner className="h-7 w-7 text-palm-700" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-lg text-palm-900">No bookings yet</p>
          <p className="mt-2 text-sm text-ink/55">When you book a stay, it'll show up here.</p>
          <Link href="/book" className="btn-primary mt-6 inline-flex">Find available dates</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-display text-lg text-palm-900">{b.homeName}</h3>
                  <StatusPill status={b.status} />
                </div>
                <p className="mt-1 text-sm text-ink/65">
                  {prettyDate(b.checkIn)} → {prettyDate(b.checkOut)} · {b.numDays} {b.numDays === 1 ? "day" : "days"} · {b.numMembers} guests
                </p>
                <p className="mt-1 text-xs text-ink/50">
                  {getRoomType(b.roomType)?.label ?? b.roomType} · Total {inr(b.totalPrice)}
                </p>
              </div>
              {b.status === "confirmed" && (
                <button onClick={() => setCancelTarget(b)} className="btn-ghost self-start text-red-700 hover:bg-red-50 sm:self-auto">
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel this booking?"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setCancelTarget(null)}>Keep booking</button>
            <button className="btn bg-red-700 text-white hover:bg-red-800" onClick={cancel} disabled={working}>
              {working ? <><Spinner /> Cancelling…</> : "Yes, cancel"}
            </button>
          </>
        }
      >
        {cancelTarget && (
          <p className="text-sm text-ink/70">
            Your stay at <strong>{cancelTarget.homeName}</strong> from {prettyDate(cancelTarget.checkIn)} will be
            cancelled. Those dates will become available for others.
          </p>
        )}
      </Modal>
    </div>
  );
}

function StatusPill({ status }: { status: "confirmed" | "cancelled" }) {
  return status === "confirmed" ? (
    <span className="rounded-full bg-palm-100 px-2.5 py-0.5 text-xs font-medium text-palm-800">Confirmed</span>
  ) : (
    <span className="rounded-full bg-ink/10 px-2.5 py-0.5 text-xs font-medium text-ink/50">Cancelled</span>
  );
}
