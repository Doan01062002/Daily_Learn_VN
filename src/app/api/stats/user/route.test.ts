/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

// Mock cookies from next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(async () => ({
    get: vi.fn().mockReturnValue(undefined),
  })),
}));

// Mock verifyToken from @/lib/jwt
vi.mock("@/lib/jwt", () => ({
  verifyToken: vi.fn(),
}));

// Mock prisma from @/lib/prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    userLessonProgress: {
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    streak: {
      findUnique: vi.fn(),
    },
  },
  __esModule: true,
}));

describe("GET /api/stats/user - Authentication", () => {
  it("should return 401 if token is missing", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue(undefined),
    } as any));

    const req = new NextRequest("http://localhost/api/stats/user");
    const res = await GET(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });
});

describe("GET /api/stats/user - Stats Computation", () => {
  it("should return compiled user stats on success", async () => {
    // Mock cookies
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    } as any));

    // Mock verifyToken
    vi.mocked(verifyToken).mockReturnValue({ userId: "user-123", role: "STUDENT" });

    // Mock count completed progress
    vi.mocked(prisma.userLessonProgress.count).mockResolvedValue(5);

    // Mock aggregate score average
    vi.mocked(prisma.userLessonProgress.aggregate).mockResolvedValue({
      _avg: { score: 85 },
    } as any);

    // Mock streak
    vi.mocked(prisma.streak.findUnique).mockResolvedValue({
      currentStreak: 3,
      maxStreak: 6,
    } as any);

    const req = new NextRequest("http://localhost/api/stats/user");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.stats).toEqual({
      completedLessons: 5,
      averageQuizScore: 85,
      currentStreak: 3,
      maxStreak: 6,
    });
  });
});
