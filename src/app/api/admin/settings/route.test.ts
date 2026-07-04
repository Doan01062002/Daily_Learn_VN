/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { promises as fs } from "fs";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/jwt", () => ({
  verifyToken: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: { count: vi.fn().mockResolvedValue(5) },
    lesson: { count: vi.fn().mockResolvedValue(5) },
    quiz: { count: vi.fn().mockResolvedValue(5) },
    paymentTransaction: { count: vi.fn().mockResolvedValue(5) },
  },
  __esModule: true,
}));

vi.mock("fs", () => ({
  promises: {
    readFile: vi.fn().mockResolvedValue(JSON.stringify({
      appName: "Daily Learn VN",
      supportPhone: "0987654321",
      maintenanceMode: false,
      premiumPrice: 199000,
      trialDays: 7,
      freeDailyLimit: 1,
      minQuizScoreToPass: 75,
      smtpSenderName: "Daily Learn VN",
      smtpSenderEmail: "support@dailylearn.vn",
    })),
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Admin System Settings API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/admin/settings", () => {
    it("should return settings if authorized admin", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue({ value: "mock-token" }),
      } as any));
      vi.mocked(verifyToken).mockReturnValue({ userId: "admin-id", email: "admin@gmail.com", role: "ADMIN" });

      const req = new NextRequest("http://localhost/api/admin/settings");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.settings.appName).toBe("Daily Learn VN");
      expect(data.settings.premiumPrice).toBe(199000);
      expect(data.settings.trialDays).toBe(7);
      expect(data.telemetry.dbConnected).toBe(true);
      expect(data.telemetry.totalDbRecords).toBe(20);
    });
  });

  describe("POST /api/admin/settings", () => {
    it("should update settings on disk if authorized admin", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue({ value: "mock-token" }),
      } as any));
      vi.mocked(verifyToken).mockReturnValue({ userId: "admin-id", email: "admin@gmail.com", role: "ADMIN" });

      const req = new NextRequest("http://localhost/api/admin/settings", {
        method: "POST",
        body: JSON.stringify({
          supportPhone: "0999888777",
          maintenanceMode: true,
          premiumPrice: 299000,
          trialDays: 14,
          freeDailyLimit: 2,
          minQuizScoreToPass: 80,
          smtpSenderName: "Daily Learn VN Premium",
          smtpSenderEmail: "support-premium@dailylearn.vn",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.settings.appName).toBe("Daily Learn VN");
      expect(data.settings.premiumPrice).toBe(299000);
      expect(data.settings.trialDays).toBe(14);
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });
});
