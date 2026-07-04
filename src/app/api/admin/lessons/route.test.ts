/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { GET, POST } from "./route";
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
    lesson: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
  __esModule: true,
}));

describe("GET /api/admin/lessons", () => {
  it("should return 401 if token is missing", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue(undefined),
    } as any));

    const req = new NextRequest("http://localhost/api/admin/lessons");
    const res = await GET(req);
    
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 403 if user role is not ADMIN", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    } as any));

    vi.mocked(verifyToken).mockReturnValue({ userId: "user-123", role: "STUDENT" });

    const req = new NextRequest("http://localhost/api/admin/lessons");
    const res = await GET(req);
    
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe("Forbidden");
  });

  it("should return list of lessons if user is ADMIN", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    } as any));

    vi.mocked(verifyToken).mockReturnValue({ userId: "admin-123", role: "ADMIN" });

    const mockLessons = [
      {
        id: "lesson-1",
        title: "Test Lesson",
        tags: ["Tech"],
        level: "Beginner",
        status: "PUBLISHED",
        sourceDomain: "test.com",
        createdAt: new Date(),
      },
    ];
    vi.mocked(prisma.lesson.findMany).mockResolvedValue(mockLessons as any);

    const req = new NextRequest("http://localhost/api/admin/lessons");
    const res = await GET(req);
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.lessons).toHaveLength(1);
    expect(data.lessons[0].title).toBe("Test Lesson");
  });
});

describe("POST /api/admin/lessons", () => {
  it("should return 401 if token is missing", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue(undefined),
    } as any));

    const req = new NextRequest("http://localhost/api/admin/lessons", {
      method: "POST",
      body: JSON.stringify({ title: "New Lesson" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 if required fields are missing", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    } as any));
    vi.mocked(verifyToken).mockReturnValue({ userId: "admin-123", role: "ADMIN" });

    // Payload is missing tags and other fields
    const req = new NextRequest("http://localhost/api/admin/lessons", {
      method: "POST",
      body: JSON.stringify({ title: "New Lesson" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Missing required fields");
  });

  it("should create lesson and its quizzes and return 201 on success", async () => {
    vi.mocked(cookies).mockImplementation(async () => ({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    } as any));
    vi.mocked(verifyToken).mockReturnValue({ userId: "admin-123", role: "ADMIN" });

    const newLessonPayload = {
      title: "New Lesson",
      tags: ["Tech"],
      sourceDomain: "dev.to",
      summary: ["Bullet 1", "Bullet 2"],
      actionableStep: "Step 1",
      level: "Beginner",
      status: "PUBLISHED",
      quizzes: [
        {
          question: "What is this?",
          options: ["A", "B"],
          correctAnswer: "A",
          explanation: "Because",
        },
      ],
    };

    const mockCreatedLesson = {
      id: "new-lesson-123",
      ...newLessonPayload,
      createdAt: new Date(),
    };

    vi.mocked(prisma.lesson.create).mockResolvedValue(mockCreatedLesson as any);

    const req = new NextRequest("http://localhost/api/admin/lessons", {
      method: "POST",
      body: JSON.stringify(newLessonPayload),
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.lesson.id).toBe("new-lesson-123");
  });
});
