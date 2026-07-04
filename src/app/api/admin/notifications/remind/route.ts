import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications";
import { hasPermission } from "../../../../../lib/permissions";

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

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const usersToRemind = await prisma.user.findMany({
      where: {
        interestedTopics: {
          hasSome: ["Tech", "Business", "Design", "SoftSkills", "Health"],
        },
        progress: {
          none: {
            status: "COMPLETED",
            completedAt: {
              gte: startOfToday,
            },
          },
        },
      },
      include: {
        streaks: true,
      },
    });

    for (const user of usersToRemind) {
      const currentStreak = user.streaks[0]?.currentStreak || 0;

      await sendEmail({
        to: user.email,
        subject: `🔥 ${user.name}, đừng để đứt chuỗi Streak ngày học hôm nay nhé!`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 12px; color: #1E293B;">
            <h2 style="font-family: sans-serif; color: #0F172A;">Duy trì chuỗi học tập liên tục của bạn!</h2>
            <p>Chào <strong>${user.name}</strong>,</p>
            <p>Chuỗi <strong>${currentStreak} ngày học liên tiếp</strong> của bạn đang có nguy cơ biến mất nếu ngày hôm nay kết thúc mà không có bài học nào được hoàn thành.</p>
            <p>Chỉ cần dành ra 5 phút để đọc tóm tắt thông thái và làm câu trắc nghiệm nhanh ngay bây giờ để nâng cấp bản thân.</p>
            <a href="http://localhost:3000/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #991B1B; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Tiếp tục học ngay</a>
          </div>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      notifiedCount: usersToRemind.length,
    });
  } catch (error) {
    console.error("POST Admin Notifications Remind Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
