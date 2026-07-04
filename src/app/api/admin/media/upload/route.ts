import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
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

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const lessonId = formData.get("lessonId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Ensure upload folder exists
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    // Clean and generate filename
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${timestamp}_${cleanName}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    // Save to disk
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueFileName}`;

    // Create DB record
    const mediaFile = await prisma.mediaFile.create({
      data: {
        fileName: file.name,
        fileUrl,
        fileSize: buffer.length,
        mimeType: file.type,
        lessonId: lessonId || null,
      },
    });

    return NextResponse.json({ success: true, file: mediaFile });
  } catch (error) {
    console.error("POST Upload Media Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
