import { Nav } from "@/components/nav";
import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Holdroom",
  description:
    "Funded milestones so freelancers cannot pocket a deposit, and clients cannot stall after delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${fraunces.variable} min-h-screen antialiased`}
      >
        <Nav />
        {children}
      </body>
    </html>
  );
}
