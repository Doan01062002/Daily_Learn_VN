import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return new Response("Unauthorized", { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== "ADMIN" && decoded.role !== "CTV" && decoded.role !== "OPERATOR")) {
      return new Response("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "financial" or "learning"
    const range = searchParams.get("range") || "7days";
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");

    if (!type || (type !== "financial" && type !== "learning")) {
      return new Response("Invalid report type. Expected 'financial' or 'learning'.", { status: 400 });
    }

    // Parse date filters
    let startDate = new Date();
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (range === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "yesterday") {
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === "30days") {
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "custom" && startParam && endParam) {
      startDate = new Date(startParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(endParam);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    }

    let csvContent = "";
    // UTF-8 BOM prefix for Microsoft Excel
    const BOM = "\uFEFF";

    if (type === "financial") {
      const transactions = await prisma.paymentTransaction.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
        },
      });

      // CSV Headers
      csvContent = "Mã Giao Dịch,Học Viên,Email,Số Tiền (VND),Trạng Thái,Ngày Tạo\n";
      
      transactions.forEach((tx) => {
        const cleanName = tx.user.name.replace(/"/g, '""');
        const statusText = tx.status === "COMPLETED" ? "Thành công" : tx.status === "PENDING" ? "Chờ xử lý" : "Thất bại";
        csvContent += `"${tx.txCode}","${cleanName}","${tx.user.email}",${tx.amount},"${statusText}","${tx.createdAt.toLocaleString("vi-VN")}"\n`;
      });
    } else if (type === "learning") {
      const progresses = await prisma.userLessonProgress.findMany({
        where: {
          completedAt: { gte: startDate, lte: endDate },
        },
        orderBy: { completedAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          lesson: { select: { title: true } },
        },
      });

      // CSV Headers
      csvContent = "Học Viên,Email,Bài Học,Điểm Quiz,Trạng Thái,Ngày Hoàn Thành\n";

      progresses.forEach((p) => {
        const cleanName = p.user.name.replace(/"/g, '""');
        const cleanLesson = p.lesson.title.replace(/"/g, '""');
        const statusText = p.status === "COMPLETED" ? "Đã xong" : "Đang học";
        const completedDate = p.completedAt ? p.completedAt.toLocaleString("vi-VN") : "N/A";
        csvContent += `"${cleanName}","${p.user.email}","${cleanLesson}",${p.score},"${statusText}","${completedDate}"\n`;
      });
    }

    const filename = `bao_cao_${type}_${range}_${new Date().toISOString().split("T")[0]}.csv`;

    return new Response(BOM + csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET Export CSV Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
