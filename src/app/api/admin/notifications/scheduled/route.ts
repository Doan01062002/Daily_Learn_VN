import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { hasPermission } from "../../../../../lib/permissions";

export const dynamic = "force-dynamic";

// GET: List all scheduled notifications
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await hasPermission(decoded.role, "manage_notifications"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const scheduled = await prisma.scheduledNotification.findMany({
      orderBy: {
        scheduledFor: "asc",
      },
    });

    return NextResponse.json({ success: true, scheduled });
  } catch (error) {
    console.error("GET Scheduled Notifications Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Create a new scheduled notification
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !(await hasPermission(decoded.role, "manage_notifications"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { subject, content, target, scheduledFor } = body;

    if (!subject || !content || !target || !scheduledFor) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (target !== "ALL" && target !== "STUDENT" && target !== "PREMIUM") {
      return NextResponse.json({ error: "Đối tượng nhận thông báo không hợp lệ" }, { status: 400 });
    }

    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      return NextResponse.json({ error: "Thời gian gửi phải ở tương lai" }, { status: 400 });
    }

    const newNotification = await prisma.scheduledNotification.create({
      data: {
        subject: subject.trim(),
        content: content.trim(),
        target,
        scheduledFor: scheduledDate,
      },
    });

    return NextResponse.json({ success: true, notification: newNotification });
  } catch (error) {
    console.error("POST Scheduled Notification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
