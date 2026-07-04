# Đặc tả Kỹ thuật: Module Luyện tập trắc nghiệm (Quiz Module)

Tài liệu này đặc tả chi tiết các endpoints câu hỏi trắc nghiệm và quy chế bảo mật chấm điểm tự động từ server.

---

## 1. Cơ chế Bảo mật Chống gian lận (Anti-Cheating Policy)

Để tránh việc người dùng xem trước mã nguồn Client và gian lận kết quả thi:
*   API lấy câu hỏi (`GET /api/lessons/[id]/quiz`) sẽ **loại bỏ** các trường `correctAnswer` (Đáp án đúng) và `explanation` (Giải thích chi tiết) ra khỏi dữ liệu trả về.
*   Client chỉ hiển thị Câu hỏi và các Lựa chọn lựa chọn.
*   Khi nộp bài, Client gửi danh sách đáp án đã chọn lên server (`POST /api/lessons/[id]/quiz/submit`). Server sẽ thực hiện tính toán chấm điểm và chỉ khi này mới trả về kết quả Đúng/Sai cùng văn bản Giải thích chi tiết của từng câu hỏi để hiển thị.

---

## 2. API Endpoints

### 2.1. API Lấy danh sách câu hỏi trắc nghiệm (`GET /api/lessons/[id]/quiz`)
*   **Xác thực**: Bắt buộc đăng nhập.
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "success": true,
      "quizzes": [
        {
          "id": "quiz-uuid-1",
          "question": "RESTful API sử dụng phương thức HTTP nào để tạo mới tài nguyên?",
          "options": [
            "GET",
            "POST",
            "PUT",
            "DELETE"
          ]
        }
      ]
    }
    ```

---

### 2.2. API Nộp bài và chấm điểm (`POST /api/lessons/[id]/quiz/submit`)
Gửi danh sách đáp án học viên đã lựa chọn lên server để chấm điểm và cập nhật tiến độ học tập.

*   **Tham số URL**: `id` là ID của bài học.
*   **Request Body**:
    ```json
    {
      "answers": [
        {
          "quizId": "quiz-uuid-1",
          "selectedAnswer": "POST"
        }
      ]
    }
    ```
*   **Xử lý phía Server**:
    1.  Lấy thông tin `userId` từ session.
    2.  Query danh sách câu hỏi gốc từ DB ứng với `lessonId` để lấy đáp án đúng.
    3.  So khớp câu trả lời của người dùng. Tính tổng số câu đúng.
    4.  Tính điểm số dưới dạng phần trăm: `score = (số câu đúng / tổng số câu) * 100`.
    5.  Cập nhật điểm số này vào cột `score` trong bảng `UserLessonProgress`.
*   **Phản hồi thành công (200 OK)**:
    ```json
    {
      "success": true,
      "score": 100,
      "totalQuestions": 1,
      "correctAnswersCount": 1,
      "results": [
        {
          "quizId": "quiz-uuid-1",
          "isCorrect": true,
          "correctAnswer": "POST",
          "explanation": "Phương thức POST được thiết kế để tạo mới một tài nguyên con thuộc tài nguyên cha."
        }
      ]
    }
    ```
