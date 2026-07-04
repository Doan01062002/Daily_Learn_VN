import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications";
import { promises as fs } from "fs";
import path from "path";
import { hasPermission } from "../../../../../lib/permissions";

export const dynamic = "force-dynamic";

const CAMPAIGNS_FILE_PATH = path.join(process.cwd(), "src", "data", "campaigns.json");

// Helper to read campaigns file
async function readCampaignsHistory() {
  try {
    const data = await fs.readFile(CAMPAIGNS_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

// Helper to write campaigns file
async function writeCampaignsHistory(history: any[]) {
  try {
    // Ensure dir exists
    const dir = path.dirname(CAMPAIGNS_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(CAMPAIGNS_FILE_PATH, JSON.stringify(history, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Failed to write campaigns history:", error);
    return false;
  }
}

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

    // 1. Count users per segment
    const totalUsers = await prisma.user.count();
    const studentUsers = await prisma.user.count({ where: { role: "STUDENT" } });
    const premiumUsers = await prisma.user.count({ where: { role: "PREMIUM" } });

    // 2. Read past campaigns
    const campaigns = await readCampaignsHistory();

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        studentUsers,
        premiumUsers,
        totalCampaigns: campaigns.length,
      },
      campaigns,
    });
  } catch (error) {
    console.error("GET Admin Campaigns Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

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
    const { subject, target, content } = body;

    if (!subject || !target || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (target !== "ALL" && target !== "STUDENT" && target !== "PREMIUM") {
      return NextResponse.json({ error: "Invalid target audience" }, { status: 400 });
    }

    // 1. Query target users
    const where: any = {};
    if (target === "STUDENT") {
      where.role = "STUDENT";
    } else if (target === "PREMIUM") {
      where.role = "PREMIUM";
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        name: true,
        email: true,
      },
    });

    if (users.length === 0) {
      return NextResponse.json({ error: "No users found in selected target audience" }, { status: 400 });
    }

    // 2. Send email to each user (mocked via console in dev)
    for (const user of users) {
      // Dynamic variables injection: replace {name} with user name
      const personalizedHtml = content.replace(/\{name\}/g, user.name);

      await sendEmail({
        to: user.email,
        subject,
        html: personalizedHtml,
      });
    }

    // 3. Record campaign log in local JSON file
    const campaigns = await readCampaignsHistory();
    const newCampaign = {
      id: crypto.randomUUID(),
      subject,
      target,
      content,
      sentCount: users.length,
      createdAt: new Date().toISOString(),
    };

    campaigns.unshift(newCampaign);
    await writeCampaignsHistory(campaigns);

    return NextResponse.json({
      success: true,
      sentCount: users.length,
      campaign: newCampaign,
    });
  } catch (error) {
    console.error("POST Admin Campaigns Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
