import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "CatatUang Project",
  description: "Aplikasi pencatatan keuangan pribadi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-theme="dark">
      <body className="antialiased min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
