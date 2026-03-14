import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pencatat Keuangan",
  description: "Aplikasi pencatatan keuangan pribadi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-blue-50 via-white to-slate-100 min-h-screen`}
      >
        <Sidebar />
        <main className="md:ml-64 min-h-screen p-4 md:p-8 flex flex-col items-center">
          <div className="w-full max-w-5xl rounded-3xl bg-white/90 shadow-2xl border border-slate-100 p-4 md:p-8 mt-2 mb-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
