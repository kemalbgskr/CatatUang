"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <main>{children}</main>;
  }

  return (
    <>
      <Sidebar />
      <main className="md:ml-64 min-h-screen p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-5xl rounded-3xl bg-white/90 shadow-2xl border border-slate-100 p-4 md:p-8 mt-2 mb-8">
          {children}
        </div>
      </main>
    </>
  );
}
