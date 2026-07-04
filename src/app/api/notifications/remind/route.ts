import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    // 1. Cron secret verification
    const authHeader = req.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!authHeader || !authHeader.startsWith("Bearer ") || !cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    if (token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Identify start of current date
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 3. Query users who registered topics but have no completed progress today
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

    // 4. Dispatch email reminders
    for (const user of usersToRemind) {
      const currentStreak = user.streaks[0]?.currentStreak || 0;

      await sendEmail({
        to: user.email,
        subject: `🔥 ${user.name}, đừng để đứt chuỗi Streak ngày học hôm nay nhé!`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #EBE6DD; border-radius: 12px; color: #3E3A35;">
            <h2 style="font-family: serif; color: #3E3A35;">Duy trì chuỗi học tập liên tục của bạn!</h2>
            <p>Chào <strong>${user.name}</strong>,</p>
            <p>Chuỗi <strong>${currentStreak} ngày học liên tiếp</strong> của bạn đang có nguy cơ biến mất nếu ngày hôm nay kết thúc mà không có bài học nào được hoàn thành.</p>
            <p>Chỉ cần dành ra 5 phút để đọc tóm tắt thông thái và làm câu trắc nghiệm nhanh ngay bây giờ để nâng cấp bản thân.</p>
            <a href="http://localhost:3000/dashboard" style="display: inline-block; padding: 10px 20px; background-color: #4E4941; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Tiếp tục học ngay</a>
          </div>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      notifiedCount: usersToRemind.length,
      users: usersToRemind.map((u) => ({
        email: u.email,
        streak: u.streaks[0]?.currentStreak || 0,
      })),
    });
  } catch (error) {
    console.error("POST Notifications Remind API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
