import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "PayTrack AI", description: "Automated payment collection" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
