# User Stories: Luyện tập trắc nghiệm tương tác (Quiz Flow)

Tài liệu này mô tả kịch bản sử dụng (User Stories) và các tiêu chí nghiệm thu (Acceptance Criteria) cho module luyện tập trắc nghiệm cuối mỗi bài học.

---

## 1. Chân dung người dùng & Kịch bản

### User Story 1: Tự kiểm tra kiến thức nhanh (Học viên chủ động)
*   **Là** một học viên vừa đọc xong tóm tắt bài học (Persona 1: Sinh viên, Persona 3: Trái ngành).
*   **Tôi muốn** làm nhanh 1-2 câu trắc nghiệm tương tác liên quan trực tiếp đến bài viết đó.
*   **Để** tôi tự đánh giá mức độ tiếp thu và hiểu sâu hơn các kiến thức vừa nạp vào.

#### Tiêu chí nghiệm thu (Acceptance Criteria):
*   **AC 1**: Cuối trang đọc bài học hiển thị liên kết "Làm trắc nghiệm củng cố" khi bài viết chưa được hoàn thành.
*   **AC 2**: Giao diện Quiz Wizard `/lessons/[id]/quiz` trình bày câu hỏi rõ ràng ở trung tâm màn hình, các phương án lựa chọn được định dạng thành các ô lớn dễ chạm (tối thiểu 48px).
*   **AC 3**: Người dùng lựa chọn một phương án và nhấn nút "Gửi đáp án" để chuyển sang bước kiểm tra kết quả.

---

### User Story 2: Phản hồi giải thích tức thì (Instant Feedback)
*   **Là** một người học muốn hiểu rõ bản chất vấn đề thay vì chỉ học vẹt.
*   **Tôi muốn** khi chọn xong đáp án, hệ thống hiển thị ngay kết quả Đúng hay Sai kèm theo phần giải thích chi tiết tại sao đáp án đó đúng/sai.
*   **Để** tôi kịp thời sửa đổi nhận thức sai lầm ngay lập tức.

#### Tiêu chí nghiệm thu (Acceptance Criteria):
*   **AC 1**: Sau khi học viên nhấn "Gửi đáp án", phương án đã chọn sẽ được tô màu trực quan:
    *   *Màu xanh lá* kèm icon check nếu lựa chọn đúng.
    *   *Màu đỏ* kèm icon x nếu lựa chọn sai, đồng thời tô viền xanh nhạt đáp án đúng thực tế.
*   **AC 2**: Một hộp nội dung "Giải thích chi tiết" (sử dụng font chữ serif dễ đọc) tự động trượt mở phía dưới câu hỏi hiển thị lý do cặn kẽ của đáp án chuẩn.
*   **AC 3**: Học viên nhấn nút "Tiếp tục" để sang câu tiếp theo hoặc chuyển đến màn hình Tổng kết nếu là câu hỏi cuối cùng.

---

### User Story 3: Xem báo cáo điểm số học tập (Score Reporting)
*   **Là** một học viên vừa hoàn thành bài test.
*   **Tôi muốn** xem một báo cáo ngắn gọn về điểm số của mình (ví dụ: "Đạt 100%" hoặc "Đạt 50%").
*   **Để** tôi theo dõi chất lượng học tập và bấm xác nhận hoàn thành bài học quay về Dashboard.

#### Tiêu chí nghiệm thu (Acceptance Criteria):
*   **AC 1**: Màn hình tổng kết hiển thị sau câu hỏi cuối cùng hiển thị điểm số (ví dụ: `80 / 100`) và phần trăm số câu đúng.
*   **AC 2**: Hiển thị nút "Hoàn tất bài học" dẫn về `/dashboard`.
*   **AC 3**: Khi nhấn hoàn tất, điểm số của bài học này sẽ được lưu vĩnh viễn vào tài khoản để phục vụ việc tổng hợp báo cáo tiến độ sau này.
