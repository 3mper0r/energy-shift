import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "EnergyShift — Energy Transition Intelligence",
  description: "Interactive scenario model linking EV adoption, renewables and lithium supply to oil demand, electricity and emissions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={noto.variable}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
