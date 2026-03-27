import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/TopNav/TopNav";
import Sidebar from "@/components/Sidebar/Sidebar";
import DetailPanel from "@/components/DetailPanel/DetailPanel";
import StatusBar from "@/components/StatusBar/StatusBar";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#080A0F",
};

export const metadata: Metadata = {
  title: "GodsEye",
  description: "Global situational awareness platform tracking ships, aircraft, satellites, and radio signals on a unified dark-mode map.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="h-full bg-[#080A0F] text-[#F8FAFC] flex flex-col overflow-hidden">
        <TopNav />
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar />
          <main className="flex-1 relative bg-[#080A0F]">
            {children}
          </main>
          <DetailPanel />
        </div>
        <StatusBar />
      </body>
    </html>
  );
}
