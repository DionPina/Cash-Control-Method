// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Cash Control Method",
  description: "Student-first budgeting system built by an accounting mind.",
  icons: {
    icon: "/cc-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="text-slate-900">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
