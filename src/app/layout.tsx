import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "SG DataViz | Open Data Portal",
  description: "Interactive Annual Report Style visualizations built on data.gov.sg.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(sans.variable, serif.variable)}>
      <body className="antialiased font-sans bg-[#FBF9F5] text-[#243324] selection:bg-[#E8DCC4] selection:text-[#1F2B1D]">
        {children}
      </body>
    </html>
  );
}
