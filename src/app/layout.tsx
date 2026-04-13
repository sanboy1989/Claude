import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "BookIt - Online Appointment Booking",
  description: "Book services from local businesses — no app needed",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BookIt",
  },
};

export const viewport: Viewport = {
  themeColor: "#171717",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK" className="h-full">
      <body className="min-h-full flex flex-col bg-neutral-50 font-sans antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-neutral-200 bg-white py-6 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} BookIt. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
