// app/layout.tsx
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import AuthBootstrap from "../src/components/AuthBootstrap";

// ─── Font ─────────────────────────────────────────────────────────────────────
// Change "Montserrat" to any Google Font you want:
// e.g. Inter, Poppins, Raleway, Nunito, DM_Sans, Outfit, Plus_Jakarta_Sans
const font = Montserrat({
  variable: "--font-main",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "The Adiraa",
  description: "The Adiraa",
  icons: {
    icon: "/images/adiraa.png",   // ← put your logo at public/icon.png
    apple: "/images/adiraa.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${font.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-main), sans-serif" }}
      >
        <AuthBootstrap />
        {children}
      </body>
    </html>
  );
}