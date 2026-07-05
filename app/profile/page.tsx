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

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [form, setForm] = useState({ name: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

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
    if (pwForm.newPassword !== pwForm.confirm) { toast.error("Passwords do not match."); return; }
    if (pwForm.newPassword.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setSavingPw(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not change password.");
      toast.success("Password changed.");
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
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
          <input
            id="currentPassword"
            type="password"
            required
            className="field"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            placeholder="••••••••"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              type="password"
              required
              className="field"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              placeholder="Min 6 chars"
            />
          </div>
          <div>
            <label className="label" htmlFor="confirm">Confirm</label>
            <input
              id="confirm"
              type="password"
              required
              className="field"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              placeholder="Repeat"
            />
          </div>
        </div>
        <button type="submit" disabled={savingPw} className="btn-ghost w-full">
          {savingPw ? <><Spinner /> Updating…</> : "Update password"}
        </button>
      </form>
    </div>
  );
}
