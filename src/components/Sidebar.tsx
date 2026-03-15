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
        className="fixed top-4 left-4 z-50 md:hidden text-white p-2.5 rounded-2xl shadow-lg"
        style={{ background: "#1e3a8a" }}
        onClick={() => setOpen(!open)}
        aria-label="Toggle sidebar"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col transform transition-transform duration-200 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        style={{
          background: "linear-gradient(180deg, #0a1628 0%, #0d1f3c 50%, #0f2348 100%)",
          borderRight: "1px solid #1e293b",
        }}
      >
        {/* Logo */}
        <div className="px-6 py-6 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}>
            💰
          </div>
          <div>
            <p className="text-white font-extrabold text-sm leading-none">Pencatat</p>
            <p className="text-blue-300 font-bold text-sm leading-none mt-0.5">Keuangan</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? "bg-white text-[#1e3a8a] shadow-lg"
                    : "text-slate-400 hover:bg-white/8 hover:text-white"
                  }`}
              >
                <item.icon size={17} className={isActive ? "text-[#1e3a8a]" : "text-slate-500"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition"
          >
            <LogOut size={17} className="text-red-400" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
