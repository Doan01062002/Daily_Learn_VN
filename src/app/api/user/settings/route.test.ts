/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT } from "./route";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
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
    paymentTransaction: {
      findMany: vi.fn(),
    },
  },
  __esModule: true,
}));

describe("User Profile Settings APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/user/settings", () => {
    it("should return 401 if token cookie is missing", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue(undefined),
      } as any));

      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("should return profile preferences and transaction history", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue({ value: "mock-token" }),
      } as any));
      vi.mocked(verifyToken).mockReturnValue({ userId: "user-1", email: "student@gmail.com", role: "STUDENT" });
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-1",
        email: "student@gmail.com",
        name: "Hoang Nam",
        role: "STUDENT",
        interestedTopics: ["Tech"],
        currentLevel: "Beginner",
        commitmentTime: 5,
        streaks: [{ currentStreak: 3, maxStreak: 3 }],
      } as any);

      vi.mocked(prisma.paymentTransaction.findMany).mockResolvedValue([
        {
          id: "tx-1",
          txCode: "TX123",
          amount: 99000,
          status: "COMPLETED",
          createdAt: new Date(),
        },
      ] as any);

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.profile.streak).toBe(3);
      expect(data.transactions).toHaveLength(1);
    });
  });

  describe("PUT /api/user/settings", () => {
    it("should update profile and return success payload", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue({ value: "mock-token" }),
      } as any));
      vi.mocked(verifyToken).mockReturnValue({ userId: "user-1", email: "student@gmail.com", role: "STUDENT" });
      
      vi.mocked(prisma.user.update).mockResolvedValue({
        name: "Nam Updated",
        interestedTopics: ["Tech", "Business"],
        currentLevel: "Experienced",
        commitmentTime: 10,
      } as any);

      const req = new NextRequest("http://localhost/api/user/settings", {
        method: "PUT",
        body: JSON.stringify({
          name: "Nam Updated",
          interestedTopics: ["Tech", "Business"],
          currentLevel: "Experienced",
          commitmentTime: 10,
        }),
      });

      const res = await PUT(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.profile.currentLevel).toBe("Experienced");
    });
  });
});
