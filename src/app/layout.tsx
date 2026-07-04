import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/layout/AuthProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "vietnamese"],
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
      className={`${inter.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF8F5] text-[#3E3A35]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
