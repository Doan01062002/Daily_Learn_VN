import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
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

    const userId = decoded.userId;

    // Fetch the list of users referred by the current user
    const referrals = await prisma.user.findMany({
      where: { referredById: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        referralRewarded: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Mask referee email for privacy (e.g. j***@domain.com)
    const formattedReferrals = referrals.map((ref) => {
      const parts = ref.email.split("@");
      const local = parts[0];
      const domain = parts[1] || "";
      const maskedLocal = local.length > 2 
        ? local[0] + "*".repeat(local.length - 2) + local[local.length - 1] 
        : local[0] + "*";
      const maskedEmail = `${maskedLocal}@${domain}`;

      return {
        id: ref.id,
        name: ref.name,
        email: maskedEmail,
        joinedAt: ref.createdAt,
        status: ref.referralRewarded ? "COMPLETED" : "PENDING",
      };
    });

    const totalInvited = formattedReferrals.length;
    const successfulReferrals = formattedReferrals.filter((r) => r.status === "COMPLETED").length;
    
    // Earned calculations (+50 KP, +1 Freeze per success)
    const pointsEarned = successfulReferrals * 50;
    const freezesEarned = successfulReferrals * 1;

    return NextResponse.json({
      success: true,
      stats: {
        totalInvited,
        successfulReferrals,
        pointsEarned,
        freezesEarned,
      },
      referrals: formattedReferrals,
    });
  } catch (error) {
    console.error("GET User Referrals Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
