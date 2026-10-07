import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";
import "./globals.css";

const mona = Mona_Sans({ subsets: ["latin"], variable: "--font-mona" });

export const metadata: Metadata = {
  title: { default: "GETSET Admin", template: "%s · GETSET Admin" },
  description: "Manage GETSET Tours & Travels content.",
  // The admin must never appear in search results.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={mona.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
