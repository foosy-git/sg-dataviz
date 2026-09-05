import type { Metadata } from "next";
import "./globals.css";
import FeedbackWidget from "@/components/ui/FeedbackWidget";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "SG DataViz | Open Data Portal",
  description: "Interactive visualizations built on data.gov.sg.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,100..900&family=Plus+Jakarta+Sans:wght@200..800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-sans bg-[#FBF9F5] text-[#243324] selection:bg-[#E8DCC4] selection:text-[#1F2B1D] min-h-screen flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <FeedbackWidget />
      </body>
    </html>
  );
}
