/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
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
    userLessonProgress: {
      count: vi.fn(),
    },
    streak: {
      findUnique: vi.fn(),
    },
    lesson: {
      findMany: vi.fn(),
    },
    userBadge: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
  __esModule: true,
}));

describe("GET /api/badges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if unauthorized", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue(undefined),
    } as any));

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("should return badges and auto-award if user completed >= 5 lessons", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    } as any));
    vi.mocked(verifyToken).mockReturnValue({ userId: "user-123", role: "STUDENT" } as any);

    // Mock progress count to 6 (triggers MOT_SACH)
    vi.mocked(prisma.userLessonProgress.count)
      .mockResolvedValueOnce(6) // first call completed count
      .mockResolvedValueOnce(0); // second call tech count

    // Mock streak to 2
    vi.mocked(prisma.streak.findUnique).mockResolvedValue({ currentStreak: 2 } as any);
    
    // Mock tech lessons to 0
    vi.mocked(prisma.lesson.findMany).mockResolvedValue([] as any);

    // Mock already unlocked badges to empty
    vi.mocked(prisma.userBadge.findMany).mockResolvedValue([] as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    const motSach = data.badges.find((b: any) => b.id === "MOT_SACH");
    expect(motSach.isUnlocked).toBe(true);

    const ngoanLau = data.badges.find((b: any) => b.id === "NGOAN_LAU_BAT_DIET");
    expect(ngoanLau.isUnlocked).toBe(false);

    expect(prisma.userBadge.createMany).toHaveBeenCalledWith({
      data: [{ userId: "user-123", badgeId: "MOT_SACH" }],
      skipDuplicates: true,
    });
  });
});
