/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications";
import { promises as fs } from "fs";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/jwt", () => ({
  verifyToken: vi.fn(),
}));

vi.mock("@/lib/notifications", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("fs", () => ({
  promises: {
    readFile: vi.fn().mockResolvedValue("[]"),
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
  __esModule: true,
}));

describe("Admin Notification Campaigns API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/admin/notifications/campaigns", () => {
    it("should return stats and history if admin", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue({ value: "mock-token" }),
      } as any));
      vi.mocked(verifyToken).mockReturnValue({ userId: "admin-id", email: "admin@gmail.com", role: "ADMIN" });

      vi.mocked(prisma.user.count).mockResolvedValue(20);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify([
        {
          id: "campaign-1",
          subject: "Test Campaign",
          target: "ALL",
          sentCount: 20,
          createdAt: new Date().toISOString(),
        }
      ]));

      const req = new NextRequest("http://localhost/api/admin/notifications/campaigns");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.stats.totalUsers).toBe(20);
      expect(data.campaigns).toHaveLength(1);
    });
  });

  describe("POST /api/admin/notifications/campaigns", () => {
    it("should send email to targeted audience and log campaign history", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue({ value: "mock-token" }),
      } as any));
      vi.mocked(verifyToken).mockReturnValue({ userId: "admin-id", email: "admin@gmail.com", role: "ADMIN" });

      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { name: "Học viên 1", email: "student1@gmail.com" },
      ] as any);
      vi.mocked(fs.readFile).mockResolvedValue("[]");

      const req = new NextRequest("http://localhost/api/admin/notifications/campaigns", {
        method: "POST",
        body: JSON.stringify({
          subject: "Tiêu đề chiến dịch",
          target: "ALL",
          content: "Nội dung thư cho {name}",
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.sentCount).toBe(1);

      // Verify email was dispatched
      expect(sendEmail).toHaveBeenCalledWith({
        to: "student1@gmail.com",
        subject: "Tiêu đề chiến dịch",
        html: "Nội dung thư cho Học viên 1",
      });

      // Verify file write log was recorded
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });
});
