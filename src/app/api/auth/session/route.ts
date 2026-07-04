import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

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

    const isOnboarded = user.interestedTopics && user.interestedTopics.length > 0;

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
