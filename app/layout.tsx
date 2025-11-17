// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Cash Control Method",
  description:
    "A student-first weekly and monthly cash planning system built by an accounting mind.",
  icons: {
    icon: "/cc-logo.png",
    shortcut: "/cc-logo.png",
    apple: "/cc-logo.png",
  },
  openGraph: {
    title: "Cash Control Method",
    description:
      "Take control of your cash with a simple, student-first budgeting system.",
    url: "https://cashcontrolmethod.com",
    siteName: "Cash Control Method",
    type: "website",
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
