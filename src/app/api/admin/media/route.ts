import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

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

    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get("lessonId");
    const unassigned = searchParams.get("unassigned") === "true";

    const where: any = {};
    if (lessonId) {
      where.lessonId = lessonId;
    } else if (unassigned) {
      where.lessonId = null;
    }

    const mediaFiles = await prisma.mediaFile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, files: mediaFiles });
  } catch (error) {
    console.error("GET Media Files Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "File ID is required." }, { status: 400 });
    }

    const mediaFile = await prisma.mediaFile.findUnique({
      where: { id },
    });

    if (!mediaFile) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    // Delete database record
    await prisma.mediaFile.delete({
      where: { id },
    });

    // Attempt to delete physical file from disk
    try {
      const fileName = path.basename(mediaFile.fileUrl);
      const filePath = path.join(process.cwd(), "public", "uploads", fileName);
      await fs.unlink(filePath);
    } catch (diskErr) {
      console.warn("Could not delete file from disk, but db record was removed:", diskErr);
    }

    return NextResponse.json({ success: true, message: "File deleted successfully." });
  } catch (error) {
    console.error("DELETE Media File Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const { id, lessonId } = body;

    if (!id) {
      return NextResponse.json({ error: "File ID is required." }, { status: 400 });
    }

    const updatedFile = await prisma.mediaFile.update({
      where: { id },
      data: {
        lessonId: lessonId || null,
      },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, file: updatedFile });
  } catch (error) {
    console.error("PUT Media File Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
