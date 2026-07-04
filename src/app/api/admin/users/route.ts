import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

// GET: List all users, with search and statistics overview
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    // 1. Fetch statistics overview metrics
    const totalCount = await prisma.user.count();
    const premiumCount = await prisma.user.count({
      where: {
        role: "PREMIUM",
      },
    });
    const adminCount = await prisma.user.count({
      where: {
        role: "ADMIN",
      },
    });
    const freeCount = totalCount - premiumCount - adminCount;

    // 2. Fetch list of users matching search query (exclude admin credentials from searches if desired, but here we list all)
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        streaks: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalCount,
        premiumCount,
        freeCount,
        adminCount,
      },
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatarUrl: u.avatarUrl,
        interestedTopics: u.interestedTopics,
        currentLevel: u.currentLevel,
        commitmentTime: u.commitmentTime,
        createdAt: u.createdAt,
        streak: u.streaks[0]?.currentStreak || 0,
        maxStreak: u.streaks[0]?.maxStreak || 0,
      })),
    });
  } catch (error) {
    console.error("GET Admin Users API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: Modify user roles (e.g. upgrade manually to PREMIUM or revert to STUDENT)
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role || !["STUDENT", "PREMIUM", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    // Update user role in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("PUT Admin Users API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Terminate student accounts
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId query param" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Protect: Prevent deleting the self/active admin account
    if (user.id === decoded.userId) {
      return NextResponse.json({ error: "Cannot delete your active session account" }, { status: 400 });
    }

    // Delete user (Prisma cascade delete will wipe out associated UserLessonProgress & Streaks if mapped)
    // To be perfectly safe, we delete them sequentially or rely on Prisma cascade delete.
    // Let's delete user streaks and progress first to prevent foreign key constraint issues.
    await prisma.streak.deleteMany({ where: { userId } });
    await prisma.userLessonProgress.deleteMany({ where: { userId } });
    await prisma.paymentTransaction.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({
      success: true,
      message: "User account deleted successfully",
    });
  } catch (error) {
    console.error("DELETE Admin Users API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
