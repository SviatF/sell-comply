import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sellcomply.com"),
  title: {
    default: "SellComply — Free Product Compliance Checker",
    template: "%s | SellComply"
  },
  description:
    "Check product regulations, marketplace requirements and compliance risks before you sell. Verify market access for Amazon, Shopify, Etsy, eBay and more.",
  keywords: [
    "product compliance checker",
    "product regulations",
    "Amazon compliance",
    "GPSR checker",
    "CE marking checker",
    "marketplace compliance",
    "sell products globally"
  ],
  openGraph: {
    title: "SellComply — Can I sell this product?",
    description:
      "Check product regulations and marketplace requirements before you launch in any country.",
    type: "website",
    siteName: "SellComply"
  },
  twitter: {
    card: "summary_large_image",
    title: "SellComply — Can I sell this product?",
    description:
      "Check product regulations and marketplace requirements before you sell."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${manrope.variable}`}>
        {children}
      </body>
    </html>
  );
}
