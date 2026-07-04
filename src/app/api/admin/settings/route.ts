import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { promises as fs } from "fs";
import path from "path";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SETTINGS_FILE_PATH = path.join(process.cwd(), "src", "data", "settings.json");

const DEFAULT_SETTINGS = {
  appName: "Daily Learn VN",
  supportPhone: "0987654321",
  maintenanceMode: false,
  premiumPrice: 199000,
  trialDays: 7,
  freeDailyLimit: 1,
  minQuizScoreToPass: 75,
  smtpSenderName: "Daily Learn VN",
  smtpSenderEmail: "support@dailylearn.vn",
  rolePermissions: {
    CTV: ["manage_lessons", "manage_quizzes"],
    OPERATOR: ["manage_users", "manage_payments", "manage_notifications"],
  }
};

// Helper to read settings
async function readSettings() {
  try {
    const data = await fs.readFile(SETTINGS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(data);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    return DEFAULT_SETTINGS;
  }
}

// Helper to write settings
async function writeSettings(settings: typeof DEFAULT_SETTINGS) {
  try {
    const dir = path.dirname(SETTINGS_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Failed to write settings:", error);
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
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings = await readSettings();

    // Compute DB telemetry health indicators dynamically
    let totalDbRecords = 0;
    let dbConnected = false;
    try {
      const [usersCount, lessonsCount, quizzesCount, paymentsCount] = await Promise.all([
        prisma.user.count(),
        prisma.lesson.count(),
        prisma.quiz.count(),
        prisma.paymentTransaction.count(),
      ]);
      totalDbRecords = usersCount + lessonsCount + quizzesCount + paymentsCount;
      dbConnected = true;
    } catch (e) {
      console.error("Database telemetry check failed:", e);
    }

    return NextResponse.json({
      success: true,
      settings,
      telemetry: {
        dbConnected,
        totalDbRecords,
        environment: process.env.NODE_ENV || "development",
      },
    });
  } catch (error) {
    console.error("GET Admin Settings Error:", error);
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
    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      supportPhone,
      maintenanceMode,
      premiumPrice,
      trialDays,
      freeDailyLimit,
      minQuizScoreToPass,
      smtpSenderName,
      smtpSenderEmail,
      rolePermissions,
    } = body;

    // Validate inputs
    if (
      !supportPhone ||
      maintenanceMode === undefined ||
      premiumPrice === undefined ||
      trialDays === undefined ||
      freeDailyLimit === undefined ||
      minQuizScoreToPass === undefined ||
      !smtpSenderName ||
      !smtpSenderEmail
    ) {
      return NextResponse.json({ error: "Missing required configuration fields" }, { status: 400 });
    }

    const newSettings = {
      appName: "Daily Learn VN",
      supportPhone: supportPhone.trim(),
      maintenanceMode: Boolean(maintenanceMode),
      premiumPrice: Number(premiumPrice),
      trialDays: Number(trialDays),
      freeDailyLimit: Number(freeDailyLimit),
      minQuizScoreToPass: Number(minQuizScoreToPass),
      smtpSenderName: smtpSenderName.trim(),
      smtpSenderEmail: smtpSenderEmail.trim(),
      rolePermissions: rolePermissions || DEFAULT_SETTINGS.rolePermissions,
    };

    const success = await writeSettings(newSettings);
    if (!success) {
      return NextResponse.json({ error: "Failed to save settings on disk" }, { status: 500 });
    }

    // Log the action to Audit Logs
    try {
      const { createAuditLog } = await import("../../../../lib/audit");
      await createAuditLog({
        userId: decoded.userId,
        userEmail: decoded.email,
        userName: decoded.email.split("@")[0],
        action: "UPDATE_SETTINGS",
        target: `Hotline: ${supportPhone}, Maintenance: ${maintenanceMode}, FreeLimit: ${freeDailyLimit}`,
      });
    } catch (e) {
      console.error("Audit log settings update failed:", e);
    }

    return NextResponse.json({
      success: true,
      settings: newSettings,
    });
  } catch (error) {
    console.error("POST Admin Settings Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
