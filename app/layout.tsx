import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "GratIA Core — Business Intelligence at Your Fingertips",
  description: "Real-time gas prices, regulatory updates, tariff tracking, and tax deductions — all in one platform built for gig workers, freelancers, and growing businesses.",
  keywords: "gas prices, gig worker tools, mileage deduction, regulatory updates, business intelligence, freelancer taxes",
  metadataBase: new URL("https://gratiacore.com"),
  openGraph: {
    type: "website",
    url: "https://gratiacore.com",
    title: "GratIA Core — Business Intelligence at Your Fingertips",
    description: "Real-time gas prices, regulatory updates, and tax deductions — built for gig workers, freelancers, and growing businesses.",
    siteName: "GratIA Core",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GratIA Core — Business Intelligence at Your Fingertips",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GratIA Core — Business Intelligence at Your Fingertips",
    description: "Real-time gas prices, regulatory updates, and tax deductions — built for gig workers, freelancers, and growing businesses.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/gratia-core-icon.svg",
    shortcut: "/gratia-core-icon.svg",
    apple: "/gratia-core-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}