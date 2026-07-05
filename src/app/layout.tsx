import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { headers, cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { promises as fs } from "fs";
import path from "path";
import { redirect } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Daily Learn VN - Micro-learning Việt Nam",
  description: "Nền tảng học tập tinh gọn 5-10 phút mỗi ngày bằng tiếng Việt, thiết kế di động tối giản và cá nhân hóa lộ trình dựa trên AI.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get current request pathname from custom header
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Check if pathname should be exempt from maintenance mode redirect
  const isMaintenanceExempt =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/api") ||
    pathname.includes("favicon.ico");

  if (!isMaintenanceExempt) {
    let maintenanceMode = false;
    try {
      const filePath = path.join(process.cwd(), "src", "data", "settings.json");
      const data = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(data);
      maintenanceMode = !!parsed.maintenanceMode;
    } catch (e) {
      // ignore
    }

    if (maintenanceMode) {
      let isStaff = false;
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if (token) {
          const decoded = verifyToken(token);
          if (decoded && (decoded.role === "ADMIN" || decoded.role === "CTV" || decoded.role === "OPERATOR")) {
            isStaff = true;
          }
        }
      } catch (e) {
        // ignore
      }

      if (!isStaff) {
        redirect("/maintenance");
      }
    }
  }

  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[#FAF8F5] text-[#3E3A35]" suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
