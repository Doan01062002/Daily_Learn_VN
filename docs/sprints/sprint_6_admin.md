# Sprint 6: Giao diện Quản trị (Admin Dashboard)

- **Mục tiêu chính**: Thiết lập hệ thống quản lý nội dung (CRUD bài học & câu hỏi trắc nghiệm) và kiểm soát truy cập phân quyền chỉ dành riêng cho tài khoản quản trị viên (`ADMIN`).

---

## Danh sách công việc (Checklist)

### 1. Specs & Stories Setup
- [x] Tạo tài liệu đặc tả kỹ thuật: `docs/specs/admin_spec.md`
- [x] Tạo tài liệu kịch bản sử dụng: `docs/user_stories/admin_flow.md`

### 2. Access Control & Backend CRUD APIs
- [ ] Thiết lập bảo vệ tuyến đường API `/api/admin/*` kiểm tra cookie session xem vai trò người dùng có phải là `ADMIN` hay không.
- [ ] Lập trình API `/api/admin/lessons` hỗ trợ:
  * `GET`: Trả về toàn bộ danh sách bài học hiện có (không giới hạn chủ đề, có phân trang).
  * `POST`: Tạo mới bài viết và đính kèm câu hỏi trắc nghiệm tương ứng.
  * `PUT`: Chỉnh sửa tiêu đề, tóm tắt, tag, mức độ hoặc trạng thái (DRAFT/PUBLISHED).
  * `DELETE`: Xóa bài học khỏi cơ sở dữ liệu.

### 3. Frontend & UIs
- [ ] Xây dựng màn hình danh sách bài viết `/admin` hiển thị thống kê tổng quan và bảng danh sách bài viết (tiêu đề, thẻ tag, trạng thái Draft/Published).
- [ ] Thiết kế form tạo/chỉnh sửa bài viết `/admin/lessons/new` hoặc `/admin/lessons/[id]/edit` nhập các trường: Tiêu đề, Tác giả/Nguồn, Chủ đề, Mức độ, Tóm tắt (3 gạch đầu dòng), Hành động thực tế, và 1 Câu hỏi trắc nghiệm (soạn Câu hỏi, 4 lựa chọn, đáp án đúng, giải thích).

---

## Tài liệu liên quan
- Đặc tả kỹ thuật: [admin_spec.md](../specs/admin_spec.md)
- Kịch bản sử dụng: [admin_flow.md](../user_stories/admin_flow.md)
