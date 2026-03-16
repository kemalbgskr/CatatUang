"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Gagal login");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "/";
    router.push(next);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#dbeafe,_#f8fafc_50%,_#eff6ff)] px-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur border border-slate-100 rounded-3xl shadow-2xl p-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Masuk Aplikasi</h1>
        <p className="text-sm text-slate-500 mt-1">CatatUang Project</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Username</label>
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-white">
              <User size={16} className="text-slate-400" />
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-sm outline-none"
                placeholder="Masukkan username"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Password</label>
            <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-white">
              <Lock size={16} className="text-slate-400" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm outline-none"
                placeholder="Masukkan password"
              />
            </div>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-semibold"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
