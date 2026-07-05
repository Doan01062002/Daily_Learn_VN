import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { promises as fs } from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    let token: string | undefined;

    // 1. Try to read from HTTP Only Cookie (Web client)
    const cookieStore = await cookies();
    token = cookieStore.get("token")?.value;

    // 2. Try to read from Authorization Header (Mobile App client)
    if (!token) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    // 3. Unauthorized if no token found
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    // 4. Verify and decode the JWT token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired token" },
        { status: 401 }
      );
    }

    // 5. Fetch User details and their Streak status from PostgreSQL
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        streaks: true, // Fetch user streak data
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.isLocked) {
      return NextResponse.json(
        { error: "Tài khoản đã bị khóa" },
        { status: 403 }
      );
    }

    // Self-heal: generate referral code if missing (e.g. for existing users)
    let userReferralCode = user.referralCode;
    if (!userReferralCode) {
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        userReferralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const codeCheck = await prisma.user.findUnique({
          where: { referralCode: userReferralCode },
        });
        if (!codeCheck) {
          isUnique = true;
        }
        attempts++;
      }
      if (!isUnique) {
        userReferralCode = `DL${Date.now().toString(36).substring(4).toUpperCase()}`;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { referralCode: userReferralCode },
      });
    }

    const isOnboarded = user.interestedTopics && user.interestedTopics.length > 0;

    // Resolve permissions dynamically for administrative roles
    let permissions: string[] = [];
    if (user.role === "ADMIN") {
      permissions = [
        "manage_lessons",
        "manage_quizzes",
        "manage_users",
        "manage_payments",
        "manage_notifications",
        "view_analytics",
        "manage_settings",
        "manage_coupons",
        "manage_feedbacks",
        "manage_media",
        "manage_grading",
      ];
    } else if (user.role === "CTV" || user.role === "OPERATOR") {
      try {
        const filePath = path.join(process.cwd(), "src", "data", "settings.json");
        const fileData = await fs.readFile(filePath, "utf-8");
        const parsed = JSON.parse(fileData);
        permissions = parsed.rolePermissions?.[user.role] || [];
      } catch {
        // Fallbacks
        if (user.role === "CTV") {
          permissions = ["manage_lessons", "manage_quizzes", "manage_feedbacks", "manage_media", "manage_grading"];
        } else if (user.role === "OPERATOR") {
          permissions = ["manage_users", "manage_payments", "manage_notifications", "manage_coupons", "manage_feedbacks", "manage_media"];
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isOnboarded,
        interestedTopics: user.interestedTopics,
        currentLevel: user.currentLevel,
        commitmentTime: user.commitmentTime,
        streak: user.streaks[0] || null, // Return the main user streak record
        streakFreezes: user.streakFreezes,
        knowledgePoints: user.knowledgePoints,
        savedLessonIds: user.savedLessonIds,
        referralCode: userReferralCode,
        permissions,
      },
    });
  } catch (error) {
    console.error("Session API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", details: errorMessage },
      { status: 500 }
    );
  }
}
