import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sellcomply.com"),
  title: {
    default: "SellComply — Product Compliance Checker for Global Sellers",
    template: "%s | SellComply",
  },
  description:
    "Check product regulations, marketplace requirements and compliance risks before you sell in a new country. Sell globally with more confidence.",
  keywords: [
    "product compliance checker",
    "global product compliance",
    "amazon compliance",
    "EU product compliance",
    "GPSR checker",
    "CE marking checker",
    "marketplace compliance",
  ],
  openGraph: {
    title: "SellComply — Can I sell this product?",
    description:
      "Check product regulations, marketplace requirements and compliance risks before you sell.",
    type: "website",
    siteName: "SellComply",
  },
  twitter: {
    card: "summary_large_image",
    title: "SellComply — Can I sell this product?",
    description:
      "Check product regulations, marketplace requirements and compliance risks before you sell.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
