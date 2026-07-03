"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/Calendar";
import { ImageSlideshow } from "@/components/ImageSlideshow";
import { Modal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { diffDays, nightsInRange, prettyDate } from "@/lib/utils";
import { ROOM_TYPES, type RoomTypeId } from "@/lib/constants";
import { INDIA_STATES, getDistricts } from "@/lib/india-districts";


interface Home {
  id: number;
  name: string;
  description: string;
  max_guests: number;
}

const MAX_GUESTS = 5;

function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function BookPage() {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [homes, setHomes] = useState<Home[]>([]);
  const [homeIds, setHomeIds] = useState<number[]>([]);
  const [disabled, setDisabled] = useState<Set<string>>(new Set());
  const [loadingAvail, setLoadingAvail] = useState(false);

  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);

  const [form, setForm] = useState({
    guestName: "",
    district: "",
    state: "Tamil Nadu",
    phone: "",
    numMembers: 2,
    roomType: "non_ac_non_ac" as RoomTypeId,
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<null | {
    homeNames: string[];
    checkIn: string;
    checkOut: string;
    numDays: number;
    numMembers: number;
    roomTypeLabel: string;
    totalPrice: number;
  }>(null);

  // Prefill name from account.
  useEffect(() => {
    if (user) setForm((f) => ({ ...f, guestName: f.guestName || user.name }));
  }, [user]);

  // Prefill phone from profile.
  useEffect(() => {
    if (!user) return;
    fetch("/api/auth/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile?.phone) setForm((f) => ({ ...f, phone: f.phone || d.profile.phone }));
      })
      .catch(() => {});
  }, [user]);

  // Load homes once and default-select the first.
  useEffect(() => {
    fetch("/api/homes")
      .then((r) => r.json())
      .then((d) => {
        const list: Home[] = d.homes || [];
        setHomes(list);
        if (list.length) setHomeIds([list[0].id]);
      })
      .catch(() => toast.error("Could not load homes."));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle a home on/off; must keep at least 1 selected.
  function toggleHome(id: number) {
    setHomeIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // don't deselect the last one
        return prev.filter((h) => h !== id);
      }
      return [...prev, id];
    });
  }

  // Load availability for all selected homes — disabled = union of booked nights.
  const loadAvailability = useCallback(
    async (ids: number[]) => {
      if (!ids.length) return;
      setLoadingAvail(true);
      setStart(null);
      setEnd(null);
      try {
        const set = new Set<string>();
        for (const id of ids) {
          const res = await fetch(`/api/availability?homeId=${id}`, { cache: "no-store" });
          const data = await res.json();
          for (const r of data.ranges || []) {
            for (const night of nightsInRange(r.checkIn, r.checkOut)) set.add(night);
          }
        }
        setDisabled(set);
      } catch {
        toast.error("Could not load availability.");
      } finally {
        setLoadingAvail(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (homeIds.length) loadAvailability(homeIds);
  }, [homeIds, loadAvailability]);

  const numDays = start && end ? diffDays(start, end) : 0;
  const selectedRoomType = ROOM_TYPES.find((r) => r.id === form.roomType)!;
  const pricePerNight = selectedRoomType.price * homeIds.length; // per home × homes
  const totalPrice = numDays > 0 ? pricePerNight * numDays : 0;
  const selectedHomeNames = homes.filter((h) => homeIds.includes(h.id)).map((h) => h.name);

  async function submit() {
    if (!homeIds.length || !start || !end) {
      toast.error("Please select a home and your stay dates.");
      return;
    }
    if (!form.guestName || !form.district || !form.state || !form.phone) {
      toast.error("Please fill in all your details.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s+/g, ""))) {
      toast.error("Enter a valid 10-digit mobile number.");
      return;
    }

    const checkIn = start;
    const checkOut = end!;

    setSubmitting(true);
    try {
      const results = [];
      for (const id of homeIds) {
        const res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            homeId: id,
            guestName: form.guestName,
            district: form.district,
            state: form.state,
            phone: form.phone,
            numMembers: form.numMembers,
            checkIn,
            checkOut,
            roomType: form.roomType,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 409) await loadAvailability(homeIds);
          throw new Error(data.error || "Could not complete your booking.");
        }
        results.push(data.booking);
      }
      setConfirmed({
        homeNames: results.map((r) => r.homeName),
        checkIn,
        checkOut,
        numDays: results[0].numDays,
        numMembers: form.numMembers,
        roomTypeLabel: selectedRoomType.label,
        totalPrice: results.reduce((s, r) => s + r.totalPrice, 0),
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const summaryTitle =
    selectedHomeNames.length === 0
      ? "Select a home"
      : selectedHomeNames.length === homes.length
      ? "Both homes"
      : selectedHomeNames[0].replace("RB Comfort Stay — ", "RB Comfort Stay · ");

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="eyebrow">Book your stay</p>
      <h1 className="mt-2 text-3xl text-palm-900 md:text-4xl">Choose a home and your dates</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Left column */}
        <div className="space-y-6">

          {/* Home selector */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg text-palm-900">Select a home</h2>
              {homes.length > 1 && (
                <button
                  onClick={() => setHomeIds(homes.map((h) => h.id))}
                  className="text-xs font-medium text-marigold-600 hover:text-marigold-500 transition"
                >
                  Select both homes
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-ink/50">You can select one or both homes for the same dates.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {homes.map((h) => {
                const selected = homeIds.includes(h.id);
                return (
                  <button
                    key={h.id}
                    onClick={() => toggleHome(h.id)}
                    className={`relative rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-palm-700 bg-palm-50 ring-2 ring-palm-600/20"
                        : "border-palm-800/15 hover:border-palm-600/40"
                    }`}
                  >
                    {/* Checkbox badge */}
                    <span
                      className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded border-2 transition ${
                        selected
                          ? "border-palm-700 bg-palm-700 text-white"
                          : "border-palm-800/25 bg-white"
                      }`}
                    >
                      {selected && (
                        <svg viewBox="0 0 12 10" className="h-3 w-3 fill-none stroke-current stroke-2">
                          <polyline points="1,5 4,8 11,1" />
                        </svg>
                      )}
                    </span>
                    <p className="font-display text-base text-palm-900 pr-7">{h.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink/60">
                      {h.description.replace(/\d+ guests/g, `${MAX_GUESTS} guests`)}
                    </p>
                    <p className="mt-2 text-xs font-medium text-marigold-600">
                      2 BHK · up to {MAX_GUESTS} guests
                    </p>
                  </button>
                );
              })}
            </div>
            {homeIds.length === homes.length && homes.length > 1 && (
              <div className="mt-3 rounded-xl bg-marigold-500/10 px-4 py-2.5 text-xs text-marigold-700 font-medium">
                Both homes selected — up to {MAX_GUESTS * homes.length} guests total across both homes.
              </div>
            )}
          </div>

          {/* Room type */}
          <div className="card p-6">
            <h2 className="text-lg text-palm-900">Room type</h2>
            <p className="mt-1 text-sm text-ink/55">
              Both homes are 2 BHK. Choose your preferred AC configuration.
            </p>
            <div className="mt-4 space-y-3">
              {ROOM_TYPES.map((rt) => (
                <label
                  key={rt.id}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                    form.roomType === rt.id
                      ? "border-palm-700 bg-palm-50 ring-2 ring-palm-600/20"
                      : "border-palm-800/15 hover:border-palm-600/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="roomType"
                      value={rt.id}
                      checked={form.roomType === rt.id}
                      onChange={() => setForm({ ...form, roomType: rt.id })}
                      className="h-4 w-4 accent-palm-700"
                    />
                    <span className="text-sm font-medium text-palm-900">{rt.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-marigold-500/15 px-3 py-1 text-sm font-semibold text-marigold-600">
                      {inr(rt.price)}<span className="font-normal text-ink/50">/night</span>
                    </span>
                    {homeIds.length > 1 && (
                      <p className="mt-1 text-[11px] text-ink/45">× {homeIds.length} homes = {inr(rt.price * homeIds.length)}/night</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="card relative p-6">
            <h2 className="text-lg text-palm-900">Pick your dates</h2>
            <p className="mt-1 text-sm text-ink/55">
              Tap your arrival day, then your departure day.
              {homeIds.length > 1 && " Dates booked in either home are blocked."}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <span className="flex items-center gap-1.5 rounded-full bg-palm-100 px-3 py-1 text-xs font-medium text-palm-800">
                🕛 Check-in: 12:00 PM
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-palm-100 px-3 py-1 text-xs font-medium text-palm-800">
                🕙 Check-out: 11:00 AM
              </span>
            </div>
            <div className="mt-5">
              {loadingAvail ? (
                <div className="flex h-64 items-center justify-center">
                  <Spinner className="h-7 w-7 text-palm-700" />
                </div>
              ) : (
                <Calendar
                  disabled={disabled}
                  start={start}
                  end={end}
                  onChange={(s, e) => { setStart(s); setEnd(e); }}
                  onInvalid={() => toast.error("Those dates include a day that's already booked.")}
                />
              )}
            </div>
          </div>

          {/* Photos for each selected home */}
          {homeIds.length > 0 && (
            <div className="card p-6">
              <h2 className="text-lg text-palm-900">Photos</h2>
              <div className={`mt-4 ${homeIds.length > 1 ? "grid grid-cols-2 gap-4" : ""}`}>
                {homes
                  .filter((h) => homeIds.includes(h.id))
                  .map((h) => (
                    <div key={h.id}>
                      {homeIds.length > 1 && (
                        <p className="mb-2 text-xs font-medium text-ink/50">
                          {h.name.replace("RB Comfort Stay — ", "")}
                        </p>
                      )}
                      <ImageSlideshow homeId={h.id} className="aspect-[4/3] w-full" />
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg text-palm-900">Your details</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="label" htmlFor="guestName">Full name</label>
                <input
                  id="guestName"
                  readOnly
                  className="field cursor-not-allowed bg-jasmine-200 opacity-70"
                  value={form.guestName}
                />
              </div>
              <div>
                <label className="label" htmlFor="phone">Mobile number</label>
                <input
                  id="phone"
                  readOnly
                  className="field cursor-not-allowed bg-jasmine-200 opacity-70"
                  value={form.phone}
                />
                <p className="mt-1 text-xs text-ink/45">Fetched from your profile.</p>
              </div>
              <div>
                <label className="label" htmlFor="state">State</label>
                <select
                  id="state"
                  className="field"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value, district: "" })}
                >
                  <option value="">Select a state</option>
                  {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="district">District</label>
                <select
                  id="district"
                  className="field"
                  value={form.district}
                  disabled={!form.state}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                >
                  <option value="">{!form.state ? "Select a state first" : "Select a district"}</option>
                  {getDistricts(form.state).map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="members">Number of guests</label>
                <select id="members" className="field" value={form.numMembers}
                  onChange={(e) => setForm({ ...form, numMembers: Number(e.target.value) })}>
                  {Array.from({ length: MAX_GUESTS }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-ink/50">
                  {homeIds.length > 1
                    ? `Up to ${MAX_GUESTS} guests per home (${MAX_GUESTS * homeIds.length} total).`
                    : `Each home hosts a maximum of ${MAX_GUESTS} guests.`}
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card overflow-hidden">
            <div className="bg-palm-800 px-6 py-4 text-jasmine-50">
              <p className="text-xs uppercase tracking-widest text-marigold-400">Your stay</p>
              <p className="font-display text-lg leading-snug">{summaryTitle}</p>
              {homeIds.length > 1 && (
                <p className="mt-0.5 text-xs text-jasmine-100/60">{homeIds.length} homes · same dates</p>
              )}
            </div>
            <div className="space-y-3 px-6 py-5 text-sm">
              <Row label="Room type" value={selectedRoomType.label} />
              <Row label="Check-in" value={start ? `${prettyDate(start)}, 12:00 PM` : "—"} />
              <Row label="Check-out" value={end ? `${prettyDate(end)}, 11:00 AM` : "—"} />
              <Row label="Total days" value={numDays ? `${numDays} ${numDays === 1 ? "day" : "days"}` : "—"} />
              <Row
                label={homeIds.length > 1 ? `Per night (${homeIds.length} homes)` : "Per night"}
                value={numDays > 0 ? inr(pricePerNight) : "—"}
              />
              <Row label="Guests" value={`${form.numMembers}`} />
            </div>
            <div className="mx-6 mb-4 rounded-xl bg-jasmine-100 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-palm-900">Total amount</span>
              <span className="font-display text-xl text-palm-900">
                {totalPrice > 0 ? inr(totalPrice) : "—"}
              </span>
            </div>
            <div className="px-6 pb-6">
              <button onClick={submit} disabled={submitting || !start || !end} className="btn-accent w-full">
                {submitting ? <><Spinner /> Confirming…</> : `Confirm booking`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      <Modal
        open={!!confirmed}
        onClose={() => { setConfirmed(null); loadAvailability(homeIds); }}
        title="Booking confirmed"
        footer={
          <>
            <button className="btn-ghost" onClick={() => { setConfirmed(null); loadAvailability(homeIds); }}>
              Book another
            </button>
            <button className="btn-primary" onClick={() => router.push("/my-bookings")}>
              View my bookings
            </button>
          </>
        }
      >
        {confirmed && (
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-palm-100 text-xl text-palm-800">✓</div>
            <p className="text-sm text-ink/70">
              Thank you, {form.guestName.split(" ")[0]}. Your stay is confirmed at{" "}
              <strong>
                {confirmed.homeNames.length === 1
                  ? confirmed.homeNames[0]
                  : "both homes"}
              </strong>.
            </p>
            {confirmed.homeNames.length > 1 && (
              <ul className="space-y-0.5 text-xs text-ink/55">
                {confirmed.homeNames.map((n) => <li key={n}>• {n}</li>)}
              </ul>
            )}
            <div className="rounded-xl bg-jasmine-100 p-4 text-sm space-y-2">
              <Row label="Room type" value={confirmed.roomTypeLabel} />
              <Row label="Check-in" value={`${prettyDate(confirmed.checkIn)}, 12:00 PM`} />
              <Row label="Check-out" value={`${prettyDate(confirmed.checkOut)}, 11:00 AM`} />
              <Row label="Total days" value={`${confirmed.numDays}`} />
              <Row label="Guests" value={`${confirmed.numMembers}`} />
              <Row label="Total amount" value={inr(confirmed.totalPrice)} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-palm-800/5 pb-2 last:border-0 last:pb-0">
      <span className="text-ink/55">{label}</span>
      <span className="font-medium text-palm-900">{value}</span>
    </div>
  );
}
