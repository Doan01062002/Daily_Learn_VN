import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications";
import { hasPermission } from "../../../../../../lib/permissions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await hasPermission(decoded.role, "manage_notifications"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();

    // 1. Fetch pending notifications scheduled for now or earlier
    const pendingNotifications = await prisma.scheduledNotification.findMany({
      where: {
        sent: false,
        scheduledFor: {
          lte: now,
        },
      },
    });

    if (pendingNotifications.length === 0) {
      return NextResponse.json({ success: true, processedCount: 0, message: "Không có thông báo hẹn giờ nào cần xử lý." });
    }

    let totalSentEmailsCount = 0;

    for (const notification of pendingNotifications) {
      // 2. Query target users
      const whereClause: any = {};
      if (notification.target === "STUDENT") {
        whereClause.role = "STUDENT";
      } else if (notification.target === "PREMIUM") {
        whereClause.role = "PREMIUM";
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          email: true,
          name: true,
        },
      });

      // 3. Dispatch emails
      await Promise.all(
        users.map(async (user) => {
          try {
            await sendEmail({
              to: user.email,
              subject: notification.subject,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                  <h2 style="color: #991b1b; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">Daily Learn VN</h2>
                  <p style="font-size: 14px; color: #334155; line-height: 1.6;">Xin chào <strong>${user.name}</strong>,</p>
                  <div style="font-size: 14px; color: #0f172a; line-height: 1.6; margin: 20px 0;">
                    ${notification.content.replace(/\n/g, "<br/>")}
                  </div>
                  <p style="font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 24px; text-align: center;">
                    Thư được gửi tự động từ hệ thống quản trị Daily Learn Việt Nam.
                  </p>
                </div>
              `,
            });
          } catch (e) {
            console.error(`Failed to send scheduled email to ${user.email}:`, e);
          }
        })
      );

      // 4. Mark as sent
      await prisma.scheduledNotification.update({
        where: { id: notification.id },
        data: { sent: true },
      });

      totalSentEmailsCount += users.length;

      // Log in Audit Logs
      try {
        const { createAuditLog } = await import("../../../../../../lib/audit");
        await createAuditLog({
          userId: decoded.userId,
          userEmail: decoded.email,
          userName: decoded.email.split("@")[0],
          action: "DISPATCH_SCHEDULED_NOTIFICATION",
          target: `Campaign Subject: ${notification.subject}, Recipient Count: ${users.length}`,
        });
      } catch (e) {
        console.error("Audit log scheduled notification send failed:", e);
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: pendingNotifications.length,
      emailsSentCount: totalSentEmailsCount,
    });
  } catch (error) {
    console.error("Scheduled Notification Process Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
