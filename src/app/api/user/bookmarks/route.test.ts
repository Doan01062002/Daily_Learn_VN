/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { POST, GET } from "./route";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(async () => ({
    get: vi.fn().mockReturnValue(undefined),
  })),
}));

vi.mock("@/lib/jwt", () => ({
  verifyToken: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    lesson: {
      findMany: vi.fn(),
    },
    userLessonProgress: {
      findMany: vi.fn(),
    },
  },
  __esModule: true,
}));

describe("POST /api/user/bookmarks", () => {
  it("should return 401 if unauthorized", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue(undefined),
    } as any));

    const req = new NextRequest("http://localhost/api/user/bookmarks", {
      method: "POST",
      body: JSON.stringify({ lessonId: "lesson-1" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("should add lesson to saved list if not bookmarked yet", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    } as any));

    vi.mocked(verifyToken).mockReturnValue({ userId: "user-123", role: "STUDENT" } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-123",
      savedLessonIds: [],
    } as any);

    vi.mocked(prisma.user.update).mockResolvedValue({
      id: "user-123",
      savedLessonIds: ["lesson-1"],
    } as any);

    const req = new NextRequest("http://localhost/api/user/bookmarks", {
      method: "POST",
      body: JSON.stringify({ lessonId: "lesson-1" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.savedLessonIds).toEqual(["lesson-1"]);
  });
});

describe("GET /api/user/bookmarks", () => {
  it("should return list of saved lessons", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    } as any));

    vi.mocked(verifyToken).mockReturnValue({ userId: "user-123", role: "STUDENT" } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-123",
      savedLessonIds: ["lesson-1"],
    } as any);

    vi.mocked(prisma.lesson.findMany).mockResolvedValue([
      {
        id: "lesson-1",
        title: "Test Lesson",
        tags: ["Tech"],
        sourceDomain: "test.com",
        summary: ["Bullet 1"],
        actionableStep: "Step 1",
        level: "Beginner",
      },
    ] as any);

    vi.mocked(prisma.userLessonProgress.findMany).mockResolvedValue([
      {
        lessonId: "lesson-1",
        status: "COMPLETED",
      },
    ] as any);

    const req = new NextRequest("http://localhost/api/user/bookmarks");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.bookmarks[0].title).toBe("Test Lesson");
    expect(data.bookmarks[0].completed).toBe(true);
  });
});
