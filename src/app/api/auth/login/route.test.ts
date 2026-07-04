/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyPassword } from "@/lib/hash";
import prisma from "@/lib/prisma";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/jwt", () => ({
  signToken: vi.fn().mockReturnValue("mock-jwt-token"),
}));

vi.mock("@/lib/hash", () => ({
  verifyPassword: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  __esModule: true,
}));

describe("Login API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully log in with correct email and password", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      set: vi.fn(),
    } as any));

    const mockUser = {
      id: "user-1",
      email: "test@gmail.com",
      password: "hashed-password-string",
      name: "Test User",
      avatarUrl: "avatar.png",
      role: "STUDENT",
      interestedTopics: ["Tech"],
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(verifyPassword).mockReturnValue(true);

    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "test@gmail.com", password: "password123" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe("test@gmail.com");
    expect(data.token).toBe("mock-jwt-token");
  });

  it("should fail when password is incorrect", async () => {
    const mockUser = {
      id: "user-1",
      email: "test@gmail.com",
      password: "hashed-password-string",
      name: "Test User",
      role: "STUDENT",
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
    vi.mocked(verifyPassword).mockReturnValue(false);

    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "test@gmail.com", password: "wrong-password" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Mật khẩu không chính xác.");
  });
});
