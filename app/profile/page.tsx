"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { Spinner } from "@/components/Spinner";

interface Profile {
  id: number;
  name: string;
  email: string;
  phone: string;
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [form, setForm] = useState({ name: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Eye toggle state for each password field
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetch("/api/auth/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setProfile(d.profile);
          setForm({ name: d.profile.name });
        } else {
          toast.error(d.error || "Could not load your profile.");
        }
      })
      .catch(() => toast.error("Could not load your profile. Please refresh."))
      .finally(() => setLoadingProfile(false));
  }, [toast]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save.");
      toast.success("Profile updated.");
      if (user) setUser({ ...user, name: form.name });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!pwForm.currentPassword) { toast.error("Enter your current password."); return; }
    if (pwForm.newPassword !== pwForm.confirm) { toast.error("Passwords do not match."); return; }
    if (pwForm.newPassword.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setSavingPw(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not change password.");
      toast.success("Password changed successfully.");
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingPw(false);
    }
  }

  if (loadingProfile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-7 w-7 text-palm-700" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-12">
      <p className="eyebrow">Account</p>
      <h1 className="mt-2 text-3xl text-palm-900">My profile</h1>

      {/* Edit profile */}
      <form onSubmit={saveProfile} className="card mt-8 p-6 space-y-4">
        <h2 className="text-lg text-palm-900">Personal details</h2>
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input
            id="name"
            required
            className="field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="label">Mobile number</label>
          <input
            readOnly
            className="field cursor-not-allowed opacity-60 bg-jasmine-200"
            value={profile?.phone ?? ""}
          />
          <p className="mt-1 text-xs text-ink/45">Mobile number cannot be changed.</p>
        </div>
        <div>
          <label className="label">Email</label>
          <input
            readOnly
            className="field cursor-not-allowed opacity-60 bg-jasmine-200"
            value={profile?.email ?? ""}
          />
          <p className="mt-1 text-xs text-ink/45">Email cannot be changed.</p>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? <><Spinner /> Saving…</> : "Save changes"}
        </button>
      </form>

      {/* Change password */}
      <form onSubmit={changePassword} className="card mt-6 p-6 space-y-4">
        <h2 className="text-lg text-palm-900">Change password</h2>

        <div>
          <label className="label" htmlFor="currentPassword">Current password</label>
          <div className="relative">
            <input
              id="currentPassword"
              type={showCurrent ? "text" : "password"}
              required
              className="field pr-11"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70 transition-colors"
              aria-label={showCurrent ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showCurrent} />
            </button>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="newPassword">New password</label>
          <div className="relative">
            <input
              id="newPassword"
              type={showNew ? "text" : "password"}
              required
              className="field pr-11"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              placeholder="Min 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70 transition-colors"
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showNew} />
            </button>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="confirm">Confirm new password</label>
          <div className="relative">
            <input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              required
              className="field pr-11"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              placeholder="Repeat new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70 transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              <EyeIcon open={showConfirm} />
            </button>
          </div>
        </div>

        <button type="submit" disabled={savingPw} className="btn-ghost w-full">
          {savingPw ? <><Spinner /> Updating…</> : "Update password"}
        </button>
      </form>
    </div>
  );
}
