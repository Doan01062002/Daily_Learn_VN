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
    paymentTransaction: {
      count: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  },
  __esModule: true,
}));

describe("Admin Payments API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/admin/payments", () => {
    it("should return 401 if token is missing", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue(undefined),
      } as any));

      const req = new NextRequest("http://localhost/api/admin/payments");
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("should return 403 if role is not ADMIN", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue({ value: "mock-token" }),
      } as any));
      vi.mocked(verifyToken).mockReturnValue({ userId: "1", email: "student@gmail.com", role: "STUDENT" });

      const req = new NextRequest("http://localhost/api/admin/payments");
      const res = await GET(req);
      expect(res.status).toBe(403);
    });

    it("should return list of transactions and stats if admin", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue({ value: "mock-token" }),
      } as any));
      vi.mocked(verifyToken).mockReturnValue({ userId: "admin-id", email: "admin@gmail.com", role: "ADMIN" });

      vi.mocked(prisma.paymentTransaction.count).mockResolvedValue(5);
      vi.mocked(prisma.paymentTransaction.findMany).mockResolvedValue([
        {
          id: "tx-1",
          userId: "user-1",
          amount: 200000,
          status: "PENDING",
          txCode: "TX12345",
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            name: "Học viên A",
            email: "studentA@gmail.com",
            avatarUrl: null,
            role: "STUDENT",
          },
        },
      ] as any);

      const req = new NextRequest("http://localhost/api/admin/payments?q=TX12345");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.payments).toHaveLength(1);
      expect(data.payments[0].txCode).toBe("TX12345");
    });
  });

  describe("PUT /api/admin/payments", () => {
    it("should update transaction status and promote user role", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue({ value: "mock-token" }),
      } as any));
      vi.mocked(verifyToken).mockReturnValue({ userId: "admin-id", email: "admin@gmail.com", role: "ADMIN" });

      vi.mocked(prisma.paymentTransaction.update).mockResolvedValue({
        id: "tx-1",
        userId: "user-1",
        amount: 200000,
        status: "COMPLETED",
        txCode: "TX12345",
      } as any);

      const req = new NextRequest("http://localhost/api/admin/payments", {
        method: "PUT",
        body: JSON.stringify({ transactionId: "tx-1", status: "COMPLETED" }),
      });
      const res = await PUT(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.payment.status).toBe("COMPLETED");

      // Verify that user role promotion is triggered
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { 
          role: "PREMIUM",
          premiumExpiresAt: null,
        },
      });
    });

    it("should set premiumExpiresAt when durationDays is provided", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue({ value: "mock-token" }),
      } as any));
      vi.mocked(verifyToken).mockReturnValue({ userId: "admin-id", email: "admin@gmail.com", role: "ADMIN" });

      vi.mocked(prisma.paymentTransaction.update).mockResolvedValue({
        id: "tx-2",
        userId: "user-2",
        amount: 200000,
        status: "COMPLETED",
        txCode: "TX56789",
      } as any);

      const req = new NextRequest("http://localhost/api/admin/payments", {
        method: "PUT",
        body: JSON.stringify({ transactionId: "tx-2", status: "COMPLETED", durationDays: 30 }),
      });
      const res = await PUT(req);
      expect(res.status).toBe(200);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-2" },
        data: { 
          role: "PREMIUM",
          premiumExpiresAt: expect.any(Date),
        },
      });
    });
  });
});
