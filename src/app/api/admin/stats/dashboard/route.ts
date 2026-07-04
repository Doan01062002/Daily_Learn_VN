import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== "ADMIN" && decoded.role !== "CTV" && decoded.role !== "OPERATOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse date filters
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "7days";
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");

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
      // Default: 7days
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    }

    // 1. Overview metrics (Filtered by range)
    const totalUsers = await prisma.user.count({
      where: { createdAt: { gte: startDate, lte: endDate } },
    });
    const premiumUsers = await prisma.user.count({
      where: {
        role: "PREMIUM",
        createdAt: { gte: startDate, lte: endDate },
      },
    });
    const freeUsers = await prisma.user.count({
      where: {
        role: "STUDENT",
        createdAt: { gte: startDate, lte: endDate },
      },
    });
    const adminUsers = await prisma.user.count({
      where: {
        role: "ADMIN",
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const totalLessons = await prisma.lesson.count();
    const publishedLessons = await prisma.lesson.count({
      where: { status: "PUBLISHED" },
    });
    const draftLessons = totalLessons - publishedLessons;

    const totalQuizzesSolved = await prisma.userLessonProgress.count({
      where: {
        status: "COMPLETED",
        completedAt: { gte: startDate, lte: endDate },
      },
    });

    // Calculate revenue (only COMPLETED PaymentTransaction within range)
    const payments = await prisma.paymentTransaction.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { amount: true },
    });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // 2. User Level Distribution within range
    const beginnerCount = await prisma.user.count({
      where: {
        currentLevel: "Beginner",
        createdAt: { gte: startDate, lte: endDate },
      },
    });
    const experiencedCount = await prisma.user.count({
      where: {
        currentLevel: "Experienced",
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    // 3. Interested Topics Popularity
    const allUsers = await prisma.user.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      select: { interestedTopics: true },
    });
    const topicCounts: Record<string, number> = {};
    allUsers.forEach((u) => {
      if (u.interestedTopics) {
        u.interestedTopics.forEach((topic) => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
      }
    });

    const topicPopularity = Object.entries(topicCounts).map(([topic, count]) => ({
      topic,
      count,
    })).sort((a, b) => b.count - a.count);

    // 4. Streak leaders (All-time top)
    const topStreaksRaw = await prisma.streak.findMany({
      take: 5,
      orderBy: { currentStreak: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
    const topStreaks = topStreaksRaw.map((s) => ({
      id: s.id,
      userId: s.userId,
      currentStreak: s.currentStreak,
      maxStreak: s.maxStreak,
      userName: s.user.name,
      userEmail: s.user.email,
      userAvatarUrl: s.user.avatarUrl,
    }));

    // 5. Recent transactions
    const recentPaymentsRaw = await prisma.paymentTransaction.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    const recentPayments = recentPaymentsRaw.map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      txCode: p.txCode,
      createdAt: p.createdAt.toISOString(),
      userName: p.user.name,
      userEmail: p.user.email,
    }));

    // 6. Recent registrations
    const recentUsers = await prisma.user.findMany({
      take: 5,
      where: {
        role: {
          not: "ADMIN",
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        avatarUrl: true,
      },
    });

    // 7. Dynamic days revenue and registration trends
    const revenueTrend = [];
    const registrationTrend = [];

    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) || 1;
    const limitDays = Math.min(daysDiff, 60);

    for (let i = limitDays - 1; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(endDate.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // Revenue for this day
      const dayPayments = await prisma.paymentTransaction.findMany({
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
        select: { amount: true },
      });
      const totalAmount = dayPayments.reduce((sum, p) => sum + p.amount, 0);
      
      revenueTrend.push({
        label: date.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" }),
        amount: totalAmount,
      });

      // Registrations for this day
      const dayRegistrations = await prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      registrationTrend.push({
        label: date.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" }),
        count: dayRegistrations,
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        premiumUsers,
        freeUsers,
        adminUsers,
        totalLessons,
        publishedLessons,
        draftLessons,
        totalQuizzesSolved,
        totalRevenue,
        beginnerCount,
        experiencedCount,
      },
      topicPopularity,
      topStreaks,
      recentPayments,
      recentUsers: recentUsers.map(ru => ({ ...ru, createdAt: ru.createdAt.toISOString() })),
      revenueTrend,
      registrationTrend,
    });
  } catch (error) {
    console.error("GET Admin Dashboard Stats Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
