# Đặc tả Kỹ thuật: Phân quyền Quản trị & CRUD APIs (Admin Specs)

Tài liệu này đặc tả cơ chế phân quyền RBAC và tập hợp các API quản lý nội dung dành cho quản trị viên.

---

## 1. Phân quyền truy cập (Access Control)

*   **Server-side Security**: Tất cả các API bắt đầu bằng `/api/admin/` sẽ chạy qua luồng kiểm tra token JWT. Nếu:
    *   Không giải mã được token: Trả về `401 Unauthorized`.
    *   Giải mã được token nhưng `user.role !== 'ADMIN'`: Trả về `403 Forbidden`.
*   **Client-side Security**: Route `/admin` và các route con sẽ sử dụng Component bảo vệ hoặc kiểm tra trạng thái session của `useAuth()`. Nếu vai trò không phải `ADMIN`, lập tức chuyển hướng về `/dashboard` hoặc hiển thị trang báo lỗi "Quyền truy cập bị từ chối".

---

## 2. API Endpoints Quản trị (`/api/admin/lessons`)

### 2.1. Lấy danh sách tất cả bài viết (`GET /api/admin/lessons`)
*   **Mục đích**: Hiển thị bảng danh sách quản lý đầy đủ.
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "success": true,
      "lessons": [
        {
          "id": "lesson-uuid-1",
          "title": "Hiểu nhanh về RESTful API",
          "tags": ["Tech"],
          "level": "Beginner",
          "status": "PUBLISHED",
          "sourceDomain": "medium.com",
          "createdAt": "2026-07-04T01:33:47Z",
          "_count": {
            "quizzes": 1
          }
        }
      ]
    }
    ```

---

### 2.2. Tạo bài viết kèm câu hỏi trắc nghiệm (`POST /api/admin/lessons`)
*   **Request Body**:
    ```json
    {
      "title": "Tên bài viết mới",
      "tags": ["Tech", "Business"],
      "sourceDomain": "dev.to",
      "summary": [
        "Ý tóm tắt chính thứ nhất.",
        "Ý tóm tắt chính thứ hai.",
        "Ý tóm tắt chính thứ ba."
      ],
      "actionableStep": "Câu thực hành hành động thực tế ngắn.",
      "level": "Beginner",
      "status": "DRAFT",
      "quizzes": [
        {
          "question": "Câu hỏi trắc nghiệm?",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "A",
          "explanation": "Giải thích tại sao đáp án A đúng."
        }
      ]
    }
    ```
*   **Phản hồi thành công (200 OK)**: Trả về thông tin bài viết vừa được tạo cùng mã trạng thái.

---

### 2.3. Cập nhật bài viết (`PUT /api/admin/lessons/[id]`)
*   **Tham số URL**: `id` bài viết cần chỉnh sửa.
*   **Request Body**: Truyền các trường cần cập nhật (ví dụ thay đổi trạng thái từ `DRAFT` sang `PUBLISHED` để phát hành bài học).
*   **Phản hồi thành công (200 OK)**: Trả về đối tượng đã sửa đổi.

---

### 2.4. Xóa bài viết (`DELETE /api/admin/lessons/[id]`)
*   **Mục đích**: Loại bỏ bài viết khỏi hệ thống. Các câu hỏi trắc nghiệm liên quan (`Quiz`) và tiến trình của học viên (`UserLessonProgress`) sẽ tự động xóa nhờ cơ chế xóa bắc cầu (`onDelete: Cascade` cấu hình trong Prisma).
*   **Phản hồi thành công (200 OK)**: `{ "success": true, "message": "Lesson deleted successfully." }`.
