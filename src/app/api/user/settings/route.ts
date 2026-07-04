import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

// GET: Fetch profile preferences and transaction history
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

    // 1. Fetch user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        streaks: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Fetch payment transactions
    const transactions = await prisma.paymentTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      profile: {
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        interestedTopics: user.interestedTopics,
        currentLevel: user.currentLevel,
        commitmentTime: user.commitmentTime,
        streak: user.streaks[0]?.currentStreak || 0,
        maxStreak: user.streaks[0]?.maxStreak || 0,
        streakFreezes: user.streakFreezes,
        knowledgePoints: user.knowledgePoints,
        savedLessonIds: user.savedLessonIds,
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        txCode: t.txCode,
        amount: t.amount,
        status: t.status,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET User Settings API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: Modify profile details and onboarding preferences
export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const { name, interestedTopics, currentLevel, commitmentTime } = body;

    // Validate inputs
    if (!name || !interestedTopics || !Array.isArray(interestedTopics) || !currentLevel || !commitmentTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (interestedTopics.length === 0) {
      return NextResponse.json({ error: "Must select at least 1 topic" }, { status: 400 });
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        name,
        interestedTopics,
        currentLevel,
        commitmentTime: Number(commitmentTime),
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        name: updatedUser.name,
        interestedTopics: updatedUser.interestedTopics,
        currentLevel: updatedUser.currentLevel,
        commitmentTime: updatedUser.commitmentTime,
      },
    });
  } catch (error) {
    console.error("PUT User Settings API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
