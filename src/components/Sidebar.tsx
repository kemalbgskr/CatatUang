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
  Moon,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
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
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme-mode");
    const initial = saved === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", initial);
    const timer = window.setTimeout(() => setTheme(initial), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme-mode", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-white shadow-lg text-slate-700 p-2 rounded-full border border-slate-200 hover:bg-slate-100 transition"
        onClick={() => setOpen(!open)}
        aria-label="Toggle sidebar"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-md shadow-xl border-r border-slate-200 text-slate-800 transform transition-transform duration-200 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        style={{ boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)" }}
      >
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2"><span className="text-blue-600">💰</span> Pencatat Keuangan</h1>
              <p className="text-xs text-slate-400 mt-1">Wealth Tracker</p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-600"
              aria-label="Toggle dark mode"
              title={theme === "light" ? "Aktifkan dark mode" : "Aktifkan light mode"}
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-100px)]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all
                  ${isActive ? "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-blue-700"}`}
                style={{ position: "relative" }}
              >
                <span className={`transition-colors ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500"}`}>{<item.icon size={22} />}</span>
                <span>{item.label}</span>
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-full bg-blue-500" />}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={logout}
            className="mt-4 w-full group flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all text-rose-600 hover:bg-rose-50"
          >
            <span className="text-rose-500"><LogOut size={22} /></span>
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setOpen(false)} />}
    </>
  );
}
