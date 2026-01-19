import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MobileBlocker } from "@/components/MobileBlocker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TypeFast - Typing Speed Test",
  description:
    "Test and improve your typing speed with this fast and clean typing test app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MobileBlocker>
          {children}
        </MobileBlocker>
      </body>
    </html>
  );
}
