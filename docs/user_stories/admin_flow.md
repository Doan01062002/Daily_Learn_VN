# User Stories: Bảng quản lý nội dung Admin (Admin Flow)

Tài liệu này mô tả kịch bản sử dụng (User Stories) và các tiêu chí nghiệm thu (Acceptance Criteria) cho Giao diện quản trị Admin Dashboard.

---

## 1. Chân dung người dùng & Kịch bản

### User Story 1: Bảo vệ phân quyền truy cập (Admin Route Guard)
*   **Là** một quản trị viên (Admin) của hệ thống Daily Learn VN.
*   **Tôi muốn** hệ thống chặn các người dùng thường (`STUDENT`, `PREMIUM`) truy cập vào tuyến đường quản trị `/admin` và chỉ hiển thị giao diện này cho tài khoản của tôi.
*   **Để** đảm bảo an toàn nội dung hệ thống, tránh việc người học tự ý sửa đổi dữ liệu hoặc xem trước đáp án trắc nghiệm.

#### Tiêu chí nghiệm thu (Acceptance Criteria):
*   **AC 1**: Khi truy cập `/admin`, hệ thống kiểm tra thuộc tính `role` của session:
    *   Nếu là `ADMIN`, hiển thị giao diện trang quản trị.
    *   Nếu là `STUDENT` hoặc `PREMIUM`, lập tức chuyển hướng về `/dashboard` hoặc hiện thông báo "Quyền truy cập bị từ chối" (403 Forbidden).
    *   Nếu chưa đăng nhập, chuyển hướng về `/login`.

---

### User Story 2: Xem danh sách & Xóa bài học (Lesson Management)
*   **Là** một Admin quản lý nội dung.
*   **Tôi muốn** xem một bảng danh sách tất cả các bài viết hiện tại kèm theo trạng thái biên soạn (DRAFT) hoặc đã phát hành (PUBLISHED).
*   **Để** tôi dễ dàng theo dõi số lượng bài học và thực hiện xóa các bài viết cũ lỗi thời.

#### Tiêu chí nghiệm thu (Acceptance Criteria):
*   **AC 1**: Trang `/admin` hiển thị danh sách bài viết dưới dạng bảng gồm các cột: Tiêu đề, Chủ đề, Mức độ, Trạng thái (Draft/Published), Số câu hỏi trắc nghiệm đính kèm, Ngày tạo và Hành động (Xóa, Xuất bản nhanh).
*   **AC 2**: Nút "Xóa" hiển thị hộp thoại xác nhận. Khi xác nhận, bài viết sẽ được xóa khỏi hệ thống thông qua API `DELETE`.

---

### User Story 3: Thêm bài học mới kèm câu hỏi trắc nghiệm (Create Lesson Wizard)
*   **Là** một Admin biên soạn tài liệu học tập.
*   **Tôi muốn** có một giao diện biểu mẫu (Form) nhập liệu rõ ràng để thêm bài viết mới và soạn kèm ngay 1 câu hỏi trắc nghiệm kiểm tra kiến thức.
*   **Để** tối ưu hóa quy trình xuất bản bài học chỉ trong 1 bước duy nhất.

#### Tiêu chí nghiệm thu (Acceptance Criteria):
*   **AC 1**: Nhấp vào nút "Thêm bài học mới" chuyển sang trang biểu mẫu `/admin/lessons/new`.
*   **AC 2**: Biểu mẫu chứa đầy đủ các trường nhập liệu chuẩn hóa:
    *   *Nội dung bài viết*: Tiêu đề, Nguồn tham khảo (sourceDomain), Chủ đề (Tech, Business, Design, SoftSkills, Health), Trình độ (Beginner, Experienced), 3 ý tóm tắt chính (mỗi ý một dòng), Hành động gợi ý.
    *   *Soạn Quiz tương ứng*: Soạn nội dung câu hỏi trắc nghiệm, nhập 4 phương án lựa chọn, click chọn 1 trong 4 phương án làm đáp án đúng, nhập lời giải thích (explanation) lý do vì sao đúng.
*   **AC 3**: Cung cấp 2 nút lưu: "Lưu bản nháp" (set status thành `DRAFT`) và "Lưu và Xuất bản" (set status thành `PUBLISHED`). Khi lưu thành công, chuyển hướng về lại màn hình quản lý `/admin`.
