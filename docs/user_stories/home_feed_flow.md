# User Stories: Trải nghiệm Dashboard, Phân phối & Đọc bài học

Tài liệu này mô tả kịch bản sử dụng (User Stories) và tiêu chí nghiệm thu (Acceptance Criteria) liên quan đến màn hình Dashboard chính, danh sách bài học đề xuất hằng ngày và luồng hoàn thành bài học để duy trì Streak.

---

## 1. Chân dung người dùng & Kịch bản

### User Story 1: Tiếp cận bài học nhanh trên Dashboard (Học viên hằng ngày)
*   **Là** một học viên đang sử dụng app mỗi sáng (Persona 2: Dân văn phòng).
*   **Tôi muốn** khi mở Dashboard, tôi thấy ngay danh sách các bài học ngắn của ngày hôm nay cùng với ước tính thời lượng đọc (ví dụ: "4 phút đọc") của từng bài.
*   **Để** tôi có thể chọn bài viết phù hợp và bắt đầu đọc ngay lập tức trong thời gian di chuyển đi làm hoặc lúc rảnh rỗi.

#### Tiêu chí nghiệm thu (Acceptance Criteria):
*   **AC 1**: Màn hình Dashboard hiển thị danh sách bài học của ngày hôm nay dạng thẻ dọc (Card list) tinh giản.
*   **AC 2**: Mỗi thẻ bài học hiển thị tiêu đề, tóm tắt ngắn, nhãn chủ đề (#Tech, #Design...), và biểu tượng thời gian kèm theo thời lượng đọc (ví dụ: `⏱ 4 phút`).
*   **AC 3**: Nếu một bài học đã được đọc trước đó trong ngày, thẻ bài học đó sẽ hiển thị biểu tượng check hoàn thành màu xanh lá (`✓ Đã xong`) và làm mờ thẻ nhẹ để phân biệt với bài chưa đọc.

---

### User Story 2: Động lực Streak học tập liên tục (Gamification)
*   **Là** một người tự học muốn rèn luyện thói quen kiên trì (Persona 1: Sinh viên, Persona 3: Trái ngành).
*   **Tôi muốn** nhìn thấy chỉ số chuỗi ngày học liên tục (Streak) của mình nổi bật ở đầu trang Dashboard kèm hiệu ứng ngọn lửa.
*   **Để** tôi cảm nhận được sự tiến bộ của bản thân và có động lực hoàn thành bài học hằng ngày để không làm đứt chuỗi.

#### Tiêu chí nghiệm thu (Acceptance Criteria):
*   **AC 1**: Widget Streak được thiết kế bắt mắt ở đầu Dashboard dưới dạng một huy hiệu lửa màu cam/đỏ.
*   **AC 2**: Hiển thị rõ số ngày học liên tục hiện tại (ví dụ: `🔥 5 Ngày liên tục`) và kỷ lục cao nhất của người dùng (`Kỷ lục: 12 ngày`).
*   **AC 3**: Khi học viên hoàn thành bài học bắt buộc cuối cùng trong ngày (đạt quota cam kết):
    *   Hộp chỉ số Streak sẽ nhấp nháy hoặc thay đổi trạng thái màu sắc để chúc mừng.
    *   Hiển thị thông điệp động chúc mừng (ví dụ: "Tuyệt vời! Bạn đã duy trì chuỗi học tập hôm nay!").

---

### User Story 3: Đọc bài và xác nhận tiến độ (Lesson Reading)
*   **Là** một học viên đang đọc nội dung bài viết.
*   **Tôi muốn** có một giao diện đọc bài tập trung, thoáng đãng, dễ đọc trên di động và một nút bấm "Tôi đã học xong bài này" lớn ở cuối bài.
*   **Để** tôi xác nhận đã tiếp thu tri thức và gửi tiến độ về máy chủ.

#### Tiêu chí nghiệm thu (Acceptance Criteria):
*   **AC 1**: Trang chi tiết bài học `/lessons/[id]` tối giản hóa giao diện: loại bỏ menu rườm rà, sử dụng font chữ serif dễ đọc, khoảng cách dòng rộng rãi (line-height: 1.6) để chống mỏi mắt.
*   **AC 2**: Cuối bài học có nút bấm "Tôi đã đọc xong" với thiết kế nổi bật, phủ rộng thumb-zone.
*   **AC 3**: Khi nhấn nút:
    *   Gửi request đến API cập nhật tiến độ.
    *   Hiện thông báo thành công dạng modal nhỏ hoặc toast thông báo số ngày Streak mới.
    *   Tự động chuyển hướng người dùng quay lại `/dashboard`.
