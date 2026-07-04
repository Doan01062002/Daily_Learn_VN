/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT, DELETE } from "./route";
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
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    streak: {
      deleteMany: vi.fn(),
    },
    userLessonProgress: {
      deleteMany: vi.fn(),
    },
    paymentTransaction: {
      deleteMany: vi.fn(),
    },
  },
  __esModule: true,
}));

describe("Admin Users Management APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/admin/users - Authorization & Fetching", () => {
    it("should return 401 if unauthorized cookie token is missing", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue(undefined),
      } as any));

      const req = new NextRequest("http://localhost/api/admin/users");
      const res = await GET(req);

      expect(res.status).toBe(401);
    });

    it("should return 403 if user is not an ADMIN", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue({ value: "mock-token" }),
      } as any));
      vi.mocked(verifyToken).mockReturnValue({ userId: "1", email: "a@a.com", role: "STUDENT" });

      const req = new NextRequest("http://localhost/api/admin/users");
      const res = await GET(req);

      expect(res.status).toBe(403);
    });

    it("should return users list and statistics if user is ADMIN", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue({ value: "mock-token" }),
      } as any));
      vi.mocked(verifyToken).mockReturnValue({ userId: "admin-id", email: "admin@gmail.com", role: "ADMIN" });
      
      // Mock stats and users
      vi.mocked(prisma.user.count).mockResolvedValue(10);
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        {
          id: "student-1",
          name: "Student One",
          email: "student1@gmail.com",
          role: "STUDENT",
          streaks: [{ currentStreak: 5, maxStreak: 10 }],
        },
      ] as any);

      const req = new NextRequest("http://localhost/api/admin/users?q=Student");
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.users).toHaveLength(1);
      expect(data.users[0].streak).toBe(5);
    });
  });

  describe("PUT /api/admin/users - Update Roles", () => {
    it("should update and return updated user role", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue({ value: "mock-token" }),
      } as any));
      vi.mocked(verifyToken).mockReturnValue({ userId: "admin-id", email: "admin@gmail.com", role: "ADMIN" });
      vi.mocked(prisma.user.update).mockResolvedValue({
        id: "student-1",
        email: "student1@gmail.com",
        role: "PREMIUM",
      } as any);

      const req = new NextRequest("http://localhost/api/admin/users", {
        method: "PUT",
        body: JSON.stringify({ userId: "student-1", role: "PREMIUM" }),
      });
      const res = await PUT(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.role).toBe("PREMIUM");
    });
  });

  describe("DELETE /api/admin/users - Account Deletion", () => {
    it("should reject deleting the active admin session user", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue({ value: "mock-token" }),
      } as any));
      vi.mocked(verifyToken).mockReturnValue({ userId: "admin-id", email: "admin@gmail.com", role: "ADMIN" });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "admin-id",
        email: "admin@gmail.com",
      } as any);

      const req = new NextRequest("http://localhost/api/admin/users?userId=admin-id", {
        method: "DELETE",
      });
      const res = await DELETE(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Cannot delete your active session account");
    });

    it("should successfully delete client record from db", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue({ value: "mock-token" }),
      } as any));
      vi.mocked(verifyToken).mockReturnValue({ userId: "admin-id", email: "admin@gmail.com", role: "ADMIN" });
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "student-1",
        email: "student1@gmail.com",
      } as any);

      const req = new NextRequest("http://localhost/api/admin/users?userId=student-1", {
        method: "DELETE",
      });
      const res = await DELETE(req);

      expect(res.status).toBe(200);
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "student-1" } });
    });
  });
});
