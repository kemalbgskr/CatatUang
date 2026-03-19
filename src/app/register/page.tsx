"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Assuming we have a register endpoint, if not this will just fail gracefully
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Gagal daftar");
      return;
    }

    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-[32px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-10 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-rose-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="flex items-center gap-3 mb-10 relative z-10">
          <div className="w-10 h-10 rounded-[12px] bg-rose-100 flex items-center justify-center">
            <span className="text-xl font-black text-rose-500">B.</span>
          </div>
          <span className="text-2xl font-black text-slate-800 tracking-tight">Budggt.</span>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2 relative z-10">Daftar Akun Baru</h1>
        <p className="text-[15px] text-slate-500 font-medium mb-8 relative z-10">Mulai perjalanan atur keuanganmu sekarang.</p>

        <form onSubmit={submit} className="space-y-5 relative z-10">
          <div>
            <label className="text-[11px] font-extrabold tracking-wide text-slate-400 mb-2 uppercase block hidden">Username</label>
            <div className="flex items-center gap-3 border border-slate-200 rounded-2xl px-4 py-3.5 bg-white focus-within:border-emerald-300 focus-within:ring focus-within:ring-emerald-100 transition-all group">
              <User size={18} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-[15px] font-semibold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400"
                placeholder="Pilih Username"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-extrabold tracking-wide text-slate-400 mb-2 uppercase block hidden">Password</label>
            <div className="flex items-center gap-3 border border-slate-200 rounded-2xl px-4 py-3.5 bg-white focus-within:border-emerald-300 focus-within:ring focus-within:ring-emerald-100 transition-all group">
              <Lock size={18} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-[15px] font-semibold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400"
                placeholder="Buat Password"
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-[13px] font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-2xl py-4 text-[15px] font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20"
          >
            {loading ? <span className="animate-spin text-xl leading-none">⏳</span> : "Buat Akun"}
          </button>
        </form>

        <p className="mt-8 text-center text-[13px] font-bold text-slate-500 relative z-10">
          Sudah punya akun? <a href="/login" className="text-slate-900 hover:underline">Masuk di sini</a>
        </p>
      </div>
    </div>
  );
}
