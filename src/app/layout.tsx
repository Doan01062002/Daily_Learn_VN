import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/layout/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daily Learn VN - Micro-learning Việt Nam",
  description: "Nền tảng học tập tinh gọn 5-10 phút mỗi ngày bằng tiếng Việt, thiết kế di động tối giản và cá nhân hóa lộ trình dựa trên AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF8F5] text-[#3E3A35]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
