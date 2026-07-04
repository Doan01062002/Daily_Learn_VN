import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

// Predefined list of badges in the system
const SYSTEM_BADGES = [
  {
    id: "MOT_SACH",
    title: "Mọt Sách Tập Sự",
    description: "Đọc hoàn thành tối thiểu 5 bài học đầu tiên",
    icon: "🎓",
  },
  {
    id: "NGOAN_LAU_BAT_DIET",
    title: "Ngọn Lửa Bất Diệt",
    description: "Duy trì chuỗi ngày học liên tục (Streak) từ 14 ngày trở lên",
    icon: "🔥",
  },
  {
    id: "CHUYEN_GIA_CONG_NGHE",
    title: "Chuyên Gia Công Nghệ",
    description: "Đọc hoàn thành toàn bộ bài học có chứa nhãn #Tech",
    icon: "💻",
  },
];

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = decoded.userId;

    // 1. Fetch user progress variables
    const completedCount = await prisma.userLessonProgress.count({
      where: { userId, status: "COMPLETED" },
    });

    const streakObj = await prisma.streak.findUnique({
      where: { userId },
    });
    const currentStreak = streakObj?.currentStreak || 0;

    const techLessons = await prisma.lesson.findMany({
      where: {
        tags: { has: "Tech" },
        status: "PUBLISHED",
      },
      select: { id: true },
    });

    const completedTechCount = await prisma.userLessonProgress.count({
      where: {
        userId,
        lessonId: { in: techLessons.map((l) => l.id) },
        status: "COMPLETED",
      },
    });

    const hasCompletedAllTech = techLessons.length > 0 && completedTechCount === techLessons.length;

    // 2. Fetch already unlocked badges
    const unlockedBadges = await prisma.userBadge.findMany({
      where: { userId },
    });
    const unlockedSet = new Set(unlockedBadges.map((b) => b.badgeId));

    const badgesToAward: string[] = [];

    // Check "Mọt sách tập sự"
    if (completedCount >= 5 && !unlockedSet.has("MOT_SACH")) {
      badgesToAward.push("MOT_SACH");
    }
    // Check "Ngọn lửa bất diệt"
    if (currentStreak >= 14 && !unlockedSet.has("NGOAN_LAU_BAT_DIET")) {
      badgesToAward.push("NGOAN_LAU_BAT_DIET");
    }
    // Check "Chuyên gia công nghệ"
    if (hasCompletedAllTech && !unlockedSet.has("CHUYEN_GIA_CONG_NGHE")) {
      badgesToAward.push("CHUYEN_GIA_CONG_NGHE");
    }

    // Award new badges in DB if any
    if (badgesToAward.length > 0) {
      await prisma.userBadge.createMany({
        data: badgesToAward.map((badgeId) => ({
          userId,
          badgeId,
        })),
        skipDuplicates: true,
      });

      badgesToAward.forEach((badgeId) => {
        unlockedBadges.push({
          id: "",
          userId,
          badgeId,
          unlockedAt: new Date(),
        });
      });
    }

    const unlockedMap = new Map(unlockedBadges.map((b) => [b.badgeId, b.unlockedAt]));

    const result = SYSTEM_BADGES.map((b) => {
      const isUnlocked = unlockedMap.has(b.id);
      return {
        ...b,
        isUnlocked,
        unlockedAt: isUnlocked ? unlockedMap.get(b.id) : null,
      };
    });

    return NextResponse.json({
      success: true,
      badges: result,
    });
  } catch (error) {
    console.error("GET Badges API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
