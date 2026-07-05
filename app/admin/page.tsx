"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calendar } from "@/components/Calendar";
import { Modal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";
import { useToast } from "@/components/Toast";
import { nightsInRange, prettyDate, toISODate, todayMidnight } from "@/lib/utils";
import { getRoomType } from "@/lib/constants";

function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

interface Booking {
  id: number;
  homeName: string;
  guestName: string;
  district: string;
  state: string;
  phone: string;
  email: string | null;
  numMembers: number;
  numDays: number;
  checkIn: string;
  checkOut: string;
  status: "confirmed" | "cancelled";
  roomType: string;
  pricePerNight: number;
  totalPrice: number;
}

type Filter = "all" | "upcoming" | "confirmed" | "cancelled";
type AdminView = "bookings" | "calendar" | "photos";

const HOMES = [
  { id: 1, label: "Home 1" },
  { id: 2, label: "Home 2" },
];

export default function AdminPage() {
  const toast = useToast();
  const [view, setView] = useState<AdminView>("bookings");

  // ── Bookings ──────────────────────────────────────────────────────────────
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [details, setDetails] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [editTarget, setEditTarget] = useState<Booking | null>(null);
  const [editDates, setEditDates] = useState({ checkIn: "", checkOut: "" });
  const [working, setWorking] = useState(false);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", { cache: "no-store" });
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch {
      toast.error("Could not load bookings.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const today = toISODate(todayMidnight());

  const stats = useMemo(() => {
    const confirmed = bookings.filter((b) => b.status === "confirmed");
    return {
      total: bookings.length,
      confirmed: confirmed.length,
      upcoming: confirmed.filter((b) => b.checkOut >= today).length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    };
  }, [bookings, today]);

  const filtered = useMemo(() => {
    let base: Booking[];
    switch (filter) {
      case "confirmed": base = bookings.filter((b) => b.status === "confirmed"); break;
      case "cancelled": base = bookings.filter((b) => b.status === "cancelled"); break;
      case "upcoming": base = bookings.filter((b) => b.status === "confirmed" && b.checkOut >= today); break;
      default: base = bookings;
    }
    // Upcoming confirmed → ascending (nearest first); past/cancelled → descending (most recent first)
    return [...base].sort((a, b) => {
      const aUp = a.status === "confirmed" && a.checkIn >= today;
      const bUp = b.status === "confirmed" && b.checkIn >= today;
      if (aUp !== bUp) return aUp ? -1 : 1;
      return aUp
        ? a.checkIn.localeCompare(b.checkIn)
        : b.checkIn.localeCompare(a.checkIn);
    });
  }, [bookings, filter, today]);

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
      loadBookings();
      loadCalendar();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  }

  // ── Calendar ──────────────────────────────────────────────────────────────
  const [calDisabled, setCalDisabled] = useState<{ h1: Set<string>; h2: Set<string> }>({
    h1: new Set(),
    h2: new Set(),
  });
  const [calLoading, setCalLoading] = useState(false);

  const loadCalendar = useCallback(async () => {
    setCalLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/availability?homeId=1", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/availability?homeId=2", { cache: "no-store" }).then((r) => r.json()),
      ]);
      const h1 = new Set<string>();
      const h2 = new Set<string>();
      for (const r of r1.ranges || []) for (const n of nightsInRange(r.checkIn, r.checkOut)) h1.add(n);
      for (const r of r2.ranges || []) for (const n of nightsInRange(r.checkIn, r.checkOut)) h2.add(n);
      setCalDisabled({ h1, h2 });
    } catch {
      toast.error("Could not load calendar.");
    } finally {
      setCalLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (view === "calendar") loadCalendar();
  }, [view, loadCalendar]);

  function openEdit(b: Booking) {
    setEditTarget(b);
    setEditDates({ checkIn: b.checkIn, checkOut: b.checkOut });
  }

  async function saveDates() {
    if (!editTarget) return;
    if (!editDates.checkIn || !editDates.checkOut || editDates.checkOut <= editDates.checkIn) {
      toast.error("Departure must be after arrival.");
      return;
    }
    setWorking(true);
    try {
      const res = await fetch(`/api/bookings/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", checkIn: editDates.checkIn, checkOut: editDates.checkOut }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not change the dates.");
      toast.success("Stay dates updated.");
      setEditTarget(null);
      loadBookings();
      loadCalendar();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  }

  // ── Photos ────────────────────────────────────────────────────────────────
  const [photoHome, setPhotoHome] = useState(1);
  const [homeImages, setHomeImages] = useState<{ id: number }[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async (homeId: number) => {
    setImagesLoading(true);
    try {
      const res = await fetch(`/api/homes/${homeId}/images`);
      const data = await res.json();
      setHomeImages(data.images || []);
    } catch {
      toast.error("Could not load photos.");
    } finally {
      setImagesLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (view === "photos") loadImages(photoHome);
  }, [view, photoHome, loadImages]);

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    let uploaded = 0;
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image.`);
          continue;
        }
        if (file.size > 8 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 8 MB limit.`);
          continue;
        }
        const data = await readFileAsDataUrl(file);
        const res = await fetch(`/api/homes/${photoHome}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        });
        if (!res.ok) {
          toast.error(`Failed to upload ${file.name}.`);
        } else {
          uploaded++;
        }
      }
      if (uploaded > 0) {
        toast.success(`${uploaded} photo${uploaded > 1 ? "s" : ""} uploaded.`);
        loadImages(photoHome);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function deleteImage(id: number) {
    try {
      const res = await fetch(`/api/images/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setHomeImages((prev) => prev.filter((i) => i.id !== id));
      toast.success("Photo deleted.");
    } catch {
      toast.error("Could not delete photo.");
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="eyebrow">Admin</p>
      <h1 className="mt-2 text-3xl text-palm-900">Dashboard</h1>

      {/* Tab bar */}
      <div className="mt-6 flex gap-1 rounded-2xl border border-palm-800/10 bg-white p-1 shadow-card w-fit">
        {(["bookings", "calendar", "photos"] as AdminView[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-xl px-5 py-2 text-sm font-medium capitalize transition ${
              view === v
                ? "bg-palm-800 text-jasmine-50 shadow-soft"
                : "text-palm-800 hover:bg-palm-800/5"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* ── Bookings view ── */}
      {view === "bookings" && (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Total bookings" value={stats.total} />
            <Stat label="Upcoming" value={stats.upcoming} accent />
            <Stat label="Confirmed" value={stats.confirmed} />
            <Stat label="Cancelled" value={stats.cancelled} />
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {(["all", "upcoming", "confirmed", "cancelled"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
                  filter === f
                    ? "bg-palm-800 text-jasmine-50"
                    : "bg-white text-palm-800 hover:bg-palm-800/5 border border-palm-800/10"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner className="h-7 w-7 text-palm-700" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card mt-6 p-10 text-center text-ink/55">No bookings in this view.</div>
          ) : (
            <div className="mt-6 space-y-3">
              {filtered.map((b) => (
                <div key={b.id} className="card p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="font-display text-lg text-palm-900">{b.guestName}</h3>
                        <StatusPill status={b.status} />
                        <span className="rounded-full bg-marigold-500/15 px-2.5 py-0.5 text-xs font-medium text-marigold-600">
                          {b.homeName.replace("RB Comfort Stay — ", "")}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-ink/65">
                        {prettyDate(b.checkIn)} → {prettyDate(b.checkOut)} · {b.numDays}{" "}
                        {b.numDays === 1 ? "day" : "days"} · {b.numMembers} guests
                      </p>
                      <p className="mt-1 text-sm text-ink/55">
                        📞 {b.phone} · {b.district}, {b.state}
                      </p>
                      <p className="mt-1 text-xs text-ink/50">
                        {getRoomType(b.roomType)?.label ?? b.roomType} · {inr(b.pricePerNight)}/night · Total {inr(b.totalPrice)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setDetails(b)} className="btn-ghost px-4 py-2">
                        Details
                      </button>
                      {b.status === "confirmed" && (
                        <>
                          <button onClick={() => openEdit(b)} className="btn-ghost px-4 py-2">
                            Change dates
                          </button>
                          <button
                            onClick={() => setCancelTarget(b)}
                            className="btn px-4 py-2 bg-red-700 text-white hover:bg-red-800"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Details modal */}
          <Modal open={!!details} onClose={() => setDetails(null)} title="Customer details">
            {details && (
              <div className="space-y-2.5 text-sm">
                <DRow label="Guest name" value={details.guestName} />
                <DRow label="Phone" value={details.phone} />
                <DRow label="Email" value={details.email || "—"} />
                <DRow label="District" value={details.district} />
                <DRow label="State" value={details.state} />
                <DRow label="Home" value={details.homeName} />
                <DRow label="Arrival" value={prettyDate(details.checkIn)} />
                <DRow label="Departure" value={prettyDate(details.checkOut)} />
                <DRow label="Total days" value={`${details.numDays}`} />
                <DRow label="Guests" value={`${details.numMembers}`} />
                <DRow label="Room type" value={getRoomType(details.roomType)?.label ?? details.roomType} />
                <DRow label="Per night" value={inr(details.pricePerNight)} />
                <DRow label="Total amount" value={inr(details.totalPrice)} />
                <DRow label="Status" value={details.status} />
              </div>
            )}
          </Modal>

          {/* Reschedule modal */}
          <Modal
            open={!!editTarget}
            onClose={() => setEditTarget(null)}
            title="Change stay dates"
            footer={
              <>
                <button className="btn-ghost" onClick={() => setEditTarget(null)}>Cancel</button>
                <button className="btn-primary" onClick={saveDates} disabled={working}>
                  {working ? <><Spinner /> Saving…</> : "Save dates"}
                </button>
              </>
            }
          >
            {editTarget && (
              <div className="space-y-4">
                <p className="text-sm text-ink/65">
                  Update the dates for {editTarget.guestName}'s stay at {editTarget.homeName}.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Arrival</label>
                    <input
                      type="date"
                      className="field"
                      min={today}
                      value={editDates.checkIn}
                      onChange={(e) => setEditDates({ ...editDates, checkIn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Departure</label>
                    <input
                      type="date"
                      className="field"
                      min={editDates.checkIn || today}
                      value={editDates.checkOut}
                      onChange={(e) => setEditDates({ ...editDates, checkOut: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </Modal>

          {/* Cancel modal */}
          <Modal
            open={!!cancelTarget}
            onClose={() => setCancelTarget(null)}
            title="Cancel this booking?"
            footer={
              <>
                <button className="btn-ghost" onClick={() => setCancelTarget(null)}>Keep booking</button>
                <button
                  className="btn bg-red-700 text-white hover:bg-red-800"
                  onClick={cancel}
                  disabled={working}
                >
                  {working ? <><Spinner /> Cancelling…</> : "Yes, cancel"}
                </button>
              </>
            }
          >
            {cancelTarget && (
              <p className="text-sm text-ink/70">
                This will cancel {cancelTarget.guestName}'s booking at {cancelTarget.homeName} and
                free up those dates.
              </p>
            )}
          </Modal>
        </>
      )}

      {/* ── Calendar view ── */}
      {view === "calendar" && (
        <div className="mt-8">
          <p className="text-sm text-ink/55 mb-6">
            Booked dates are shown with a strikethrough. Use this to quickly see which homes are free.
          </p>
          {calLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner className="h-7 w-7 text-palm-700" />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="card p-6">
                <h2 className="text-lg text-palm-900 mb-5">Home 1</h2>
                <Calendar
                  disabled={calDisabled.h1}
                  start={null}
                  end={null}
                  onChange={() => {}}
                />
              </div>
              <div className="card p-6">
                <h2 className="text-lg text-palm-900 mb-5">Home 2</h2>
                <Calendar
                  disabled={calDisabled.h2}
                  start={null}
                  end={null}
                  onChange={() => {}}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Photos view ── */}
      {view === "photos" && (
        <div className="mt-8">
          {/* Home selector */}
          <div className="flex gap-2">
            {HOMES.map((h) => (
              <button
                key={h.id}
                onClick={() => setPhotoHome(h.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition border ${
                  photoHome === h.id
                    ? "bg-palm-800 text-jasmine-50 border-palm-800"
                    : "bg-white text-palm-800 border-palm-800/15 hover:bg-palm-800/5"
                }`}
              >
                {h.label}
              </button>
            ))}
          </div>

          {/* Upload button */}
          <div className="mt-6 flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => uploadFiles(e.target.files)}
            />
            <button
              className="btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <><Spinner /> Uploading…</>
              ) : (
                <>
                  <span>+</span> Add photos
                </>
              )}
            </button>
            <p className="text-xs text-ink/45">JPEG, PNG, WEBP · max 8 MB each</p>
          </div>

          {/* Image grid */}
          {imagesLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner className="h-7 w-7 text-palm-700" />
            </div>
          ) : homeImages.length === 0 ? (
            <div className="card mt-6 flex h-48 flex-col items-center justify-center gap-3 text-ink/45">
              <p className="text-sm">No photos for Home {photoHome} yet.</p>
              <button
                className="btn-ghost text-sm px-4 py-2"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload the first photo
              </button>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {homeImages.map((img) => (
                <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl bg-palm-100">
                  <img
                    src={`/api/images/${img.id}`}
                    alt="Home photo"
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() => deleteImage(img.id)}
                    aria-label="Delete photo"
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`card p-5 ${accent ? "bg-palm-800 text-jasmine-50" : ""}`}>
      <p className={`text-3xl font-display ${accent ? "text-marigold-400" : "text-palm-900"}`}>{value}</p>
      <p className={`mt-1 text-xs uppercase tracking-wider ${accent ? "text-jasmine-100/70" : "text-ink/50"}`}>
        {label}
      </p>
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

function DRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-palm-800/5 pb-2 last:border-0">
      <span className="text-ink/55">{label}</span>
      <span className="text-right font-medium text-palm-900">{value}</span>
    </div>
  );
}
