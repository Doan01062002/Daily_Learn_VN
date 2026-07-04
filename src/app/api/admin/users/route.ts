import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { hasPermission } from "../../../../lib/permissions";
import { hashPassword } from "../../../../lib/hash";

// GET: List all users, with search and statistics overview
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await hasPermission(decoded.role, "manage_users"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const role = searchParams.get("role") || "";
    const level = searchParams.get("level") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (level) {
      where.currentLevel = level;
    }

    // 1. Fetch statistics overview metrics (always for all users in database)
    const statsTotalCount = await prisma.user.count();
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
    const freeCount = statsTotalCount - premiumCount - adminCount;

    // Count matching users under active filters
    const filteredCount = await prisma.user.count({ where });

    // 2. Fetch paginated list of users matching search query and filters
    const users = await prisma.user.findMany({
      where,
      include: {
        streaks: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalCount: statsTotalCount,
        premiumCount,
        freeCount,
        adminCount,
      },
      totalCount: filteredCount,
      totalPages: Math.ceil(filteredCount / limit),
      currentPage: page,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isLocked: u.isLocked,
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

// POST: Create a new user account manually
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await hasPermission(decoded.role, "manage_users"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Vui lòng điền đầy đủ các thông tin bắt buộc" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: "Định dạng Email không hợp lệ" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu phải dài ít nhất 6 ký tự" }, { status: 400 });
    }

    if (!["STUDENT", "PREMIUM", "ADMIN", "CTV", "OPERATOR"].includes(role)) {
      return NextResponse.json({ error: "Vai trò không hợp lệ" }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email này đã được sử dụng" }, { status: 400 });
    }

    const hashedPassword = hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        password: hashedPassword,
        role,
        streaks: {
          create: {
            currentStreak: 0,
            maxStreak: 0,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("POST Admin Users API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: Modify user details, roles, password, and lock/unlock status
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await hasPermission(decoded.role, "manage_users"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, name, email, password, role, isLocked } = body;

    if (!userId) {
      return NextResponse.json({ error: "Thiếu ID tài khoản" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 });
    }

    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (email !== undefined) {
      const cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return NextResponse.json({ error: "Định dạng Email không hợp lệ" }, { status: 400 });
      }

      if (cleanEmail !== user.email.toLowerCase()) {
        const duplicate = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });
        if (duplicate) {
          return NextResponse.json({ error: "Email này đã được sử dụng" }, { status: 400 });
        }
      }
      updateData.email = cleanEmail;
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: "Mật khẩu phải dài ít nhất 6 ký tự" }, { status: 400 });
      }
      updateData.password = hashPassword(password);
    }

    if (role !== undefined) {
      if (!["STUDENT", "PREMIUM", "ADMIN", "CTV", "OPERATOR"].includes(role)) {
        return NextResponse.json({ error: "Vai trò không hợp lệ" }, { status: 400 });
      }
      updateData.role = role;
    }

    if (isLocked !== undefined) {
      // Prevent admin from locking their own account
      if (userId === decoded.userId && isLocked === true) {
        return NextResponse.json({ error: "Bạn không thể tự khóa tài khoản của chính mình" }, { status: 400 });
      }
      updateData.isLocked = isLocked;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isLocked: updatedUser.isLocked,
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
    if (!decoded || !(await hasPermission(decoded.role, "manage_users"))) {
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

    // Delete user streaks, progress, submissions, feedbacks, payment transactions first
    await prisma.streak.deleteMany({ where: { userId } });
    await prisma.userLessonProgress.deleteMany({ where: { userId } });
    await prisma.paymentTransaction.deleteMany({ where: { userId } });
    await prisma.feedback.deleteMany({ where: { userId } });
    await prisma.submission.deleteMany({ where: { userId } });
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
