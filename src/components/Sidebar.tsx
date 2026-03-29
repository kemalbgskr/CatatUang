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

  const menuItems = [
    { href: "/", label: "Home", icon: <LayoutDashboard size={20} /> },
    { href: "/dompet", label: "Dompet", icon: <CreditCard size={20} /> },
    { href: "/pengeluaran", label: "Pengeluaran", icon: <TrendingDown size={20} /> },
    { href: "/pendapatan", label: "Pemasukan", icon: <TrendingUp size={20} /> },
    { href: "/budget", label: "Budget", icon: <BarChart3 size={20} /> },
    { href: "/scanner", label: "Scanner", icon: <span className="text-[20px] leading-none">📷</span> },
    { href: "/goals", label: "Goals", icon: <span className="text-[20px] leading-none">🎯</span> },
    { href: "/aset", label: "Aset", icon: <span className="text-[20px] leading-none">🏛️</span> },
    { href: "/utang", label: "Utang", icon: <TrendingUp size={20} className="rotate-180" /> },
    { href: "/piutang", label: "Piutang", icon: <HandCoins size={20} /> },
  ];

  const bottomItems = [
    { href: "/ai-advisor", label: "AI Advisor", icon: <span className="text-[20px] leading-none">🤖</span>, isHighlighted: true },
    { href: "/analisa", label: "Laporan", icon: <BarChart3 size={20} /> },
    { href: "/pengaturan", label: "Profil", icon: <Settings size={20} /> },
  ];

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 md:hidden text-slate-900 bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm"
        onClick={() => setOpen(!open)}
        aria-label="Toggle sidebar"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col transform transition-transform duration-200 ease-in-out bg-white border-r border-slate-100
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo */}
        <div className="px-8 py-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded-[10px] bg-rose-100 flex items-center justify-center text-rose-500 font-extrabold text-[17px]">
            B.
          </div>
          <p className="text-slate-900 font-extrabold text-[22px] tracking-tight leading-none">Budggt.</p>
        </div>

        {/* Nav Top */}
        <nav className="flex-1 px-4 py-2 space-y-0.5 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-[14px] font-bold transition-all
                  ${isActive
                    ? "bg-[#FFE4DE] text-gray-900"
                    : "text-slate-500 hover:bg-slate-50 hover:text-gray-900"
                  }`}
              >
                <div className={isActive ? "text-gray-900" : "text-slate-400 opacity-80"}>
                  {item.icon}
                </div>
                {item.label}
              </Link>
            );
          })}

          <div className="pt-6 pb-2">
            {bottomItems.map((item) => {
              const isActive = pathname === item.href;
              const isHighlighted = item.isHighlighted;
              
              if (isHighlighted) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-[14px] font-bold transition-all mb-1
                      ${isActive ? "bg-rose-300 text-rose-950" : "bg-rose-200 text-rose-900 hover:bg-rose-300"}`}
                  >
                    <div className="opacity-90">{item.icon}</div>
                    {item.label}
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-[14px] font-bold transition-all
                    ${isActive
                      ? "bg-[#FFE4DE] text-gray-900"
                      : "text-slate-500 hover:bg-slate-50 hover:text-gray-900"
                    }`}
                >
                  <div className={isActive ? "text-gray-900" : "text-slate-400 opacity-80"}>
                    {item.icon}
                  </div>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-6 space-y-1 block bg-white">
          <Link
            href="/yang-baru"
            className="flex items-center gap-4 px-4 py-3 rounded-2xl text-[13px] font-bold text-slate-400 hover:bg-slate-50 hover:text-gray-900 transition-all"
          >
            <span className="w-5 flex justify-center opacity-70">✨</span>
            Yang Baru
          </Link>
          <button
            type="button"
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-[13px] font-bold text-slate-400 hover:bg-slate-50 hover:text-gray-900 transition-all"
          >
            <span className="w-5 flex justify-center opacity-70">🌙</span>
            Mode Gelap
          </button>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-[13px] font-bold text-rose-400 hover:bg-rose-50 transition-all"
          >
            <LogOut size={16} strokeWidth={2.5} className="text-rose-400" />
            Logout
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
