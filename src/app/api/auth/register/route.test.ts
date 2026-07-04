/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/jwt", () => ({
  signToken: vi.fn().mockReturnValue("mock-jwt-token"),
}));

vi.mock("@/lib/hash", () => ({
  hashPassword: vi.fn().mockReturnValue("hashed-password-result"),
}));

vi.mock("@/lib/notifications", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    otpVerification: {
      upsert: vi.fn(),
    },
  },
  __esModule: true,
}));

describe("Register API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully trigger OTP verification for a new registration", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.otpVerification.upsert).mockResolvedValue({} as any);

    const req = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "New Student", email: "newuser@gmail.com", password: "password123" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.otpSent).toBe(true);
    expect(data.email).toBe("newuser@gmail.com");
  });

  it("should fail registration if email is already taken", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "existing-user",
      email: "existing@gmail.com",
    } as any);

    const req = new NextRequest("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "Test User", email: "existing@gmail.com", password: "password123" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Email này đã được sử dụng để đăng ký.");
  });
});
