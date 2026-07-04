# Sprint 4: Luyện tập trắc nghiệm (Quiz Module)

- **Mục tiêu chính**: Thiết lập hệ thống câu hỏi trắc nghiệm tương tác để kiểm tra kiến thức và tính năng chấm điểm lưu trữ tiến độ.

---

## Danh sách công việc (Checklist)

### 1. Specs & Stories Setup
- [x] Tạo tài liệu đặc tả kỹ thuật: `docs/specs/quiz_spec.md`
- [x] Tạo tài liệu kịch bản sử dụng: `docs/user_stories/quiz_flow.md`

### 2. Backend & Database Seed
- [ ] Lập trình API `/api/lessons/[id]/quiz` lấy danh sách câu hỏi trắc nghiệm của bài học.
- [ ] Lập trình API `/api/lessons/[id]/quiz/submit` chấm điểm tự động, lưu điểm số `score` vào bảng `UserLessonProgress`.
- [ ] Cập nhật tệp seed dữ liệu (`prisma/seed.ts`) tạo sẵn ít nhất 1-2 câu hỏi trắc nghiệm mẫu cho mỗi bài học trong số 12 bài mẫu hiện tại.

### 3. Frontend & UIs
- [ ] Xây dựng màn hình làm trắc nghiệm `/lessons/[id]/quiz` hiển thị từng câu hỏi lần lượt (Step-by-step).
- [ ] Hiển thị phản hồi Đúng/Sai ngay lập tức kèm theo văn bản giải thích (`explanation`).
- [ ] Thiết kế màn hình tổng kết hiển thị điểm số, tỷ lệ trả lời đúng và nút quay lại Dashboard.

---

## Tài liệu liên quan
- Đặc tả kỹ thuật: [quiz_spec.md](../specs/quiz_spec.md)
- Kịch bản sử dụng: [quiz_flow.md](../user_stories/quiz_flow.md)
