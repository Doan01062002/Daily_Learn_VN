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

    // Query all users with their streaks and completed lessons progress
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        role: true,
        streaks: {
          select: {
            currentStreak: true,
            maxStreak: true,
          },
        },
        progress: {
          where: {
            status: "COMPLETED",
          },
          select: {
            id: true,
          },
        },
      },
    });

    // Format list mapping streak and progress count
    const formatted = users.map((u) => {
      const currentStreak = u.streaks[0]?.currentStreak || 0;
      const completedLessons = u.progress.length;

      return {
        name: u.name,
        avatarUrl: u.avatarUrl,
        role: u.role,
        currentStreak,
        completedLessons,
      };
    });

    // Sort by currentStreak DESC, completedLessons DESC
    formatted.sort((a, b) => {
      if (b.currentStreak !== a.currentStreak) {
        return b.currentStreak - a.currentStreak;
      }
      return b.completedLessons - a.completedLessons;
    });

    // Take top 10 and map rank index
    const leaderboard = formatted.slice(0, 10).map((user, idx) => ({
      rank: idx + 1,
      ...user,
    }));

    return NextResponse.json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    console.error("GET Leaderboard API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
