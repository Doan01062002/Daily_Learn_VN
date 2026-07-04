import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

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

    // 1. Find all memberships of this user
    const memberships = await prisma.groupMembership.findMany({
      where: { userId: decoded.userId },
      include: {
        group: {
          include: {
            memberships: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                    streaks: {
                      select: {
                        currentStreak: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const groupsData = [];

    // Helper for today's date bounds in Vietnam timezone
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const membership of memberships) {
      const group = membership.group;
      const memberIds = group.memberships.map((m) => m.userId);

      // Fetch completed progress for members today
      const completedToday = await prisma.userLessonProgress.findMany({
        where: {
          userId: { in: memberIds },
          status: "COMPLETED",
          completedAt: { gte: startOfToday },
        },
        select: {
          userId: true,
        },
      });

      // Map user id to completed status
      const completedUserIdsSet = new Set(completedToday.map((c) => c.userId));

      // Fetch group completed progress in last 6 months for group heatmap
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const groupProgress = await prisma.userLessonProgress.findMany({
        where: {
          userId: { in: memberIds },
          status: "COMPLETED",
          completedAt: { gte: sixMonthsAgo },
        },
        select: {
          completedAt: true,
        },
      });

      // Group by date string (en-CA -> YYYY-MM-DD)
      const heatmap: Record<string, number> = {};
      groupProgress.forEach((p) => {
        if (p.completedAt) {
          const dateStr = p.completedAt.toLocaleDateString("en-CA", {
            timeZone: "Asia/Ho_Chi_Minh",
          });
          heatmap[dateStr] = (heatmap[dateStr] || 0) + 1;
        }
      });

      // Map group members with today's completion status
      const members = group.memberships.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
        streak: m.user.streaks[0]?.currentStreak || 0,
        completedToday: completedUserIdsSet.has(m.userId),
      }));

      groupsData.push({
        id: group.id,
        name: group.name,
        code: group.code,
        createdAt: group.createdAt,
        members,
        heatmap,
      });
    }

    // Fetch active Kudobox reactions received by the user in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const reactions = await prisma.groupReaction.findMany({
      where: {
        receiverId: decoded.userId,
        createdAt: { gte: oneDayAgo },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      groups: groupsData,
      reactions,
    });
  } catch (error) {
    console.error("GET Groups API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
