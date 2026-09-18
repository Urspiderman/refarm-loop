import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ReFarm Loop",
  description: "Digital Circular Agricultural Supply Chain",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}