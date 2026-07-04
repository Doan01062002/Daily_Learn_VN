import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications";
import { hasPermission } from "@/lib/permissions";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await hasPermission(decoded.role, "view_analytics"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1. Calculate time threshold (7 days ago)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 2. Query statistics from PostgreSQL
    const [newUsers, weeklyPayments, completedLessons, activeStreaks] = await Promise.all([
      // New users registered in the last 7 days
      prisma.user.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
      // Successful transactions in the last 7 days
      prisma.paymentTransaction.findMany({
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        select: {
          amount: true,
        },
      }),
      // Lessons completed in the last 7 days
      prisma.userLessonProgress.count({
        where: {
          status: "COMPLETED",
          completedAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
      // Users with active learning streaks (streak > 0)
      prisma.streak.count({
        where: {
          currentStreak: {
            gt: 0,
          },
        },
      }),
    ]);

    const weeklyRevenue = weeklyPayments.reduce((sum, tx) => sum + tx.amount, 0);

    // 3. Read SMTP receiver email from settings.json
    let receiverEmail = "admin@dailylearn.vn";
    let senderName = "Daily Learn VN";
    try {
      const filePath = path.join(process.cwd(), "src", "data", "settings.json");
      const data = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(data);
      receiverEmail = parsed.smtpSenderEmail || receiverEmail;
      senderName = parsed.smtpSenderName || senderName;
    } catch (e) {
      // ignore
    }

    // 4. Construct beautiful HTML report email template
    const htmlReport = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: sans-serif; background-color: #f8fafc; color: #0f172a; padding: 20px; margin: 0; }
    .card { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; max-width: 550px; margin: 0 auto; box-shadow: 0 4px 10px rgba(0,0,0,0.04); }
    .header { text-align: center; border-bottom: 1px solid #f1f5f9; pb: 20px; margin-bottom: 24px; }
    .title { color: #881337; font-weight: 800; font-size: 20px; margin: 0; }
    .subtitle { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 6px 0 0 0; }
    .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
    .metric-card { background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 18px; border-radius: 12px; text-align: center; }
    .metric-title { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; }
    .metric-value { font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 6px; }
    .highlight-green { color: #059669 !important; }
    .highlight-amber { color: #d97706 !important; }
    .commentary { font-size: 12px; color: #475569; line-height: 1.6; background-color: #f1f5f9; padding: 14px; border-radius: 10px; margin-top: 20px; }
    .footer { text-align: center; color: #94a3b8; font-size: 10px; margin-top: 32px; border-top: 1px solid #f1f5f9; pt: 20px; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 class="title">Báo cáo Hoạt động Tuần</h2>
      <p class="subtitle">${senderName} • Hệ thống Quản trị</p>
    </div>
    
    <p style="font-size: 13px; line-height: 1.5; color: #334155;">
      Xin chào Quản trị viên,<br/>
      Dưới đây là tổng hợp kết quả hoạt động vận hành của ứng dụng trong 7 ngày qua (từ ngày ${new Date(sevenDaysAgo).toLocaleDateString("vi-VN")} đến ngày ${new Date().toLocaleDateString("vi-VN")}):
    </p>
    
    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-title">Học viên Mới</div>
        <div class="metric-value">+${newUsers}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Doanh thu Premium</div>
        <div class="metric-value highlight-green">+${weeklyRevenue.toLocaleString("vi-VN")} đ</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Bài học Đã xong</div>
        <div class="metric-value">${completedLessons}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Streak Active</div>
        <div class="metric-value highlight-amber">${activeStreaks}</div>
      </div>
    </div>

    <div class="commentary">
      <strong>Đánh giá hệ thống:</strong> Kết nối Database ổn định. Số lượng Streak hoạt động phản ánh học viên tham gia học tập đều đặn. Doanh thu Premium ghi nhận giao dịch thành công tự động.
    </div>

    <div class="footer">
      Thư mục này được tạo tự động bởi hệ thống Daily Learn VN.<br/>
      Email nhận: ${receiverEmail} • Mọi phản hồi vui lòng gửi về hòm thư hỗ trợ.
    </div>
  </div>
</body>
</html>`;

    // 5. Send report via mock email service
    const success = await sendEmail({
      to: receiverEmail,
      subject: `[Báo cáo Tuần] Kết quả hoạt động hệ thống - ${new Date().toLocaleDateString("vi-VN")}`,
      html: htmlReport,
    });

    return NextResponse.json({
      success,
      receiverEmail,
      stats: {
        newUsers,
        weeklyRevenue,
        completedLessons,
        activeStreaks,
      },
    });
  } catch (error) {
    console.error("POST Admin Reports API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
