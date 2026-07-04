/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, PUT, DELETE } from "./route";
import { POST as importPOST } from "./import/route";
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
    quiz: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      createMany: vi.fn(),
    },
    lesson: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
  __esModule: true,
}));

describe("Admin Quizzes API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/admin/quizzes", () => {
    it("should return 401 if token is missing", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue(undefined),
      } as any));

      const req = new NextRequest("http://localhost/api/admin/quizzes");
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("should return list of quizzes and lessons if admin", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue({ value: "mock-token" }),
      } as any));
      vi.mocked(verifyToken).mockReturnValue({ userId: "admin-id", email: "admin@gmail.com", role: "ADMIN" });

      vi.mocked(prisma.quiz.count).mockResolvedValue(10);
      vi.mocked(prisma.quiz.findMany).mockResolvedValue([
        {
          id: "quiz-1",
          lessonId: "lesson-1",
          question: "Which of the following is correct?",
          options: ["A", "B", "C"],
          correctAnswer: "A",
          explanation: "Just because",
          lesson: {
            title: "Lesson Title",
          },
        },
      ] as any);
      vi.mocked(prisma.lesson.findMany).mockResolvedValue([
        { id: "lesson-1", title: "Lesson Title" },
      ] as any);

      const req = new NextRequest("http://localhost/api/admin/quizzes");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.quizzes).toHaveLength(1);
      expect(data.lessons).toHaveLength(1);
    });
  });

  describe("POST /api/admin/quizzes", () => {
    it("should create a new quiz question linked to a lesson", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue({ value: "mock-token" }),
      } as any));
      vi.mocked(verifyToken).mockReturnValue({ userId: "admin-id", email: "admin@gmail.com", role: "ADMIN" });

      vi.mocked(prisma.lesson.findUnique).mockResolvedValue({ id: "lesson-1" } as any);
      vi.mocked(prisma.quiz.create).mockResolvedValue({
        id: "new-quiz-id",
        lessonId: "lesson-1",
        question: "Is this correct?",
        options: ["Yes", "No"],
        correctAnswer: "Yes",
      } as any);

      const req = new NextRequest("http://localhost/api/admin/quizzes", {
        method: "POST",
        body: JSON.stringify({
          lessonId: "lesson-1",
          question: "Is this correct?",
          options: ["Yes", "No"],
          correctAnswer: "Yes",
          explanation: "Correct explanation",
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.quiz.id).toBe("new-quiz-id");
    });
  });

  describe("PUT /api/admin/quizzes", () => {
    it("should update an existing quiz question", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue({ value: "mock-token" }),
      } as any));
      vi.mocked(verifyToken).mockReturnValue({ userId: "admin-id", email: "admin@gmail.com", role: "ADMIN" });

      vi.mocked(prisma.quiz.findUnique).mockResolvedValue({ id: "quiz-1" } as any);
      vi.mocked(prisma.lesson.findUnique).mockResolvedValue({ id: "lesson-1" } as any);
      vi.mocked(prisma.quiz.update).mockResolvedValue({
        id: "quiz-1",
        lessonId: "lesson-1",
        question: "Updated question text",
        options: ["Yes", "No"],
        correctAnswer: "No",
      } as any);

      const req = new NextRequest("http://localhost/api/admin/quizzes", {
        method: "PUT",
        body: JSON.stringify({
          id: "quiz-1",
          lessonId: "lesson-1",
          question: "Updated question text",
          options: ["Yes", "No"],
          correctAnswer: "No",
          explanation: "Updated explanation",
        }),
      });
      const res = await PUT(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.quiz.question).toBe("Updated question text");
    });
  });

  describe("DELETE /api/admin/quizzes", () => {
    it("should delete an existing quiz", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue({ value: "mock-token" }),
      } as any));
      vi.mocked(verifyToken).mockReturnValue({ userId: "admin-id", email: "admin@gmail.com", role: "ADMIN" });

      vi.mocked(prisma.quiz.findUnique).mockResolvedValue({ id: "quiz-1" } as any);
      vi.mocked(prisma.quiz.delete).mockResolvedValue({ id: "quiz-1" } as any);

      const req = new NextRequest("http://localhost/api/admin/quizzes?id=quiz-1", {
        method: "DELETE",
      });
      const res = await DELETE(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  describe("POST /api/admin/quizzes/import", () => {
    it("should bulk import quiz questions successfully", async () => {
      vi.mocked(cookies).mockImplementation(async () => ({
        get: vi.fn().mockReturnValue({ value: "mock-token" }),
      } as any));
      vi.mocked(verifyToken).mockReturnValue({ userId: "admin-id", email: "admin@gmail.com", role: "ADMIN" });

      vi.mocked(prisma.lesson.findMany).mockResolvedValue([
        { id: "lesson-1" },
      ] as any);
      vi.mocked(prisma.quiz.createMany).mockResolvedValue({ count: 2 } as any);

      const req = new NextRequest("http://localhost/api/admin/quizzes/import", {
        method: "POST",
        body: JSON.stringify({
          quizzes: [
            {
              lessonId: "lesson-1",
              question: "Question 1?",
              options: ["A", "B"],
              correctAnswer: "A",
            },
            {
              lessonId: "lesson-1",
              question: "Question 2?",
              options: ["C", "D"],
              correctAnswer: "D",
            },
          ],
        }),
      });
      const res = await importPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.count).toBe(2);
    });
  });
});
