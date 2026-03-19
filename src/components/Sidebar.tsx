"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  CreditCard,
  HandCoins,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pendapatan", label: "Pendapatan", icon: TrendingUp },
  { href: "/pengeluaran", label: "Pengeluaran", icon: TrendingDown },
  { href: "/utang", label: "Utang", icon: CreditCard },
  { href: "/piutang", label: "Piutang", icon: HandCoins },
  { href: "/analisa", label: "Analisa", icon: BarChart3 },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden text-slate-900 bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm"
        onClick={() => setOpen(!open)}
        aria-label="Toggle sidebar"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col transform transition-transform duration-200 ease-in-out bg-white border-r border-slate-100
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-8 py-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-extrabold text-lg">
            C.
          </div>
          <div>
            <p className="text-slate-900 font-extrabold text-2xl tracking-tight leading-none">CatatUang.</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[15px] font-semibold transition-all
                  ${isActive
                    ? "bg-[#FFE4DE] text-gray-900"
                    : "text-slate-500 hover:bg-slate-50 hover:text-gray-900"
                  }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-gray-900" : "text-slate-400"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-4 py-6 space-y-1 border-t border-slate-50">
          <Link
            href="/yang-baru"
            className="flex items-center gap-4 px-4 py-3 rounded-2xl text-[15px] font-semibold text-slate-500 hover:bg-slate-50 hover:text-gray-900 transition-all"
          >
            <span className="w-5 flex justify-center">✨</span>
            Yang Baru
          </Link>
          <button
            type="button"
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-[15px] font-semibold text-slate-500 hover:bg-slate-50 hover:text-gray-900 transition-all"
          >
            <span className="w-5 flex justify-center">🌙</span>
            Mode Gelap
          </button>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-[15px] font-semibold text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} className="text-red-500" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
