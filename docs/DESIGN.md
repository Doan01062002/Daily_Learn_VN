# Design System: Daily Learn VN

Tài liệu này định nghĩa Hệ thống Thiết kế ngữ nghĩa (Semantic Design System) tương thích hoàn toàn với Google Stitch. Hệ thống thiết kế được xây dựng dựa trên phong cách tạp chí tối giản cao cấp (Editorial Minimalist), tập trung vào kiểu chữ Serif hiện đại, màu sắc trung tính thanh lịch và tương tác mượt mà.

---

## 1. Visual Theme & Atmosphere

*   **Ý tưởng cốt lõi**: "Thư viện học thuật tinh hoa". Giao diện mang lại cảm giác tĩnh lặng, tập trung, trí tuệ nhưng ấm áp và gần gũi.
*   **Mật độ thông tin (Density)**: `Daily App Balanced` (Mức 5/10) - Không gian thoáng đãng, các khối nội dung được tách biệt rõ ràng bởi khoảng trắng (negative space) thay vì các viền kẻ thô cứng.
*   **Độ biến thiên bố cục (Variance)**: `Offset Asymmetric` (Mức 7/10) - Bố cục không đối xứng, tạo điểm nhấn nghệ thuật bằng các khối căn lề so lệch tự nhiên.
*   **Chuyển động (Motion)**: `Fluid CSS` (Mức 5/10) - Các hiệu ứng hover và active phản hồi nhanh nhạy, mượt mà bằng hiệu ứng lò xo (Spring Physics).

---

## 2. Color Palette & Roles

Hệ thống sử dụng dải màu trung tính ấm áp (Warm Neutrals), tuyệt đối cấm dải màu gradient tím/neon phản quang phổ biến của AI.

*   **Canvas White** (`#FAF8F5`) - Màu nền chính của ứng dụng, tạo cảm giác như trang giấy sách cao cấp.
*   **Pure Surface** (`#FFFFFF`) - Màu nền của các thẻ Card, Popover và biểu mẫu cần làm nổi bật cấu trúc.
*   **Charcoal Ink** (`#3E3A35`) - Màu chữ chính, màu tiêu đề và các đường kẻ phân cách đậm nét. Không dùng màu đen tuyệt đối (`#000000`).
*   **Muted Steel** (`#8C8375`) - Màu chữ phụ, mô tả ngắn, nhãn metadata và các biểu tượng không hoạt động.
*   **Whisper Border** (`#EBE6DD`) - Màu viền mờ cho Card, nút phụ và các phân cách nhẹ.
*   **Amber Ochre** (`#BF753F`) - **Màu Accent duy nhất**, dùng để nhấn mạnh huy hiệu Premium, ngày Streak 🔥 đang hoạt động và các vòng Focus bảo mật.

---

## 3. Typography Rules

*   **Display / Tiêu đề chính**: `Instrument Serif` (Hoặc `Lora` làm font dự phòng) - Font Serif hiện đại thanh lịch, viết sát chữ (track-tight), phân cấp bằng độ đậm nhạt và sắc thái thay vì phóng to quá cỡ.
*   **Body / Văn bản thường**: `Satoshi` (Hoặc `Inter` làm font dự phòng) - Kiểu chữ không chân (Sans-serif) trung tính, khoảng cách dòng rộng rãi (relaxed leading), tối đa 65 ký tự trên một dòng để mắt dễ đọc.
*   **Mono / Số liệu & Mã code**: `JetBrains Mono` - Dành cho các con số thống kê ngày Streak, điểm số Quiz và giờ học.
*   **Quy tắc cấm (Banned)**: Cấm dùng các font serif phổ thông thô kệch (`Times New Roman`, `Georgia`).

---

## 4. Component Stylings

*   **Nút bấm (Buttons)**:
    *   *Primary Button*: Nền `#4E4941`, chữ trắng `#FFFFFF`. Hover chuyển sang `#3E3A35`. Active có hiệu ứng lún nhẹ down-click (`translate-y-[1px]`).
    *   *Secondary Button*: Nền trắng `#FFFFFF`, viền `#D5CFC5`, chữ `#4E4941`.
    *   *Cấm*: Cấm các nút bấm có bóng đổ phát quang màu xanh/tím neon.
*   **Thẻ chứa (Cards)**:
    *   Góc bo tròn rộng (`rounded-2xl` hoặc `1.5rem`). Viền siêu mờ `1px solid #EBE6DD`. Bóng đổ khuếch tán mềm mại, màu bóng đổ pha một chút sắc đất ấm của nền.
*   **Ô nhập liệu (Inputs)**:
    *   Nhãn (Label) luôn nằm phía trên ô nhập liệu. Viền chuyển sang màu `#8C8375` khi focus. Không dùng hiệu ứng nhãn bay (floating labels).
*   **Trạng thái tải (Loaders)**:
    *   Sử dụng khung xương xám mờ (Skeleton Loader) khớp với kích thước của khối nội dung thực tế. Cấm sử dụng các vòng xoay tròn đơn điệu.

---

## 5. Layout Principles

*   **Không xếp đè (No Overlapping)**: Tất cả các phần tử phải chiếm không gian riêng biệt, không xếp chồng layer tuyệt đối đè lên nhau gây rối mắt.
*   **Bố cục bất đối xứng (Asymmetric Hero)**: Màn hình giới thiệu hoặc tiêu đề lớn sử dụng bố cục chia đôi (Split Screen) hoặc căn trái thoáng đãng.
*   **Cấm bố cục 3 cột đều nhau**: Cấm dùng lưới 3 thẻ tính năng có kích thước bằng nhau chia đều màn hình (AI Tell). Hãy thay bằng lưới so lệch 2 cột hoặc hàng cuộn ngang không đối xứng.
*   **Giới hạn chiều rộng**: Bọc nội dung trong khung giới hạn `max-w-6xl` (1152px) căn giữa màn hình để đảm bảo giao diện hiển thị tinh tế trên các màn hình siêu rộng.

---

## 6. Motion & Interaction

*   **Spring Physics**: Tất cả các chuyển động hover của thẻ card và nút bấm sử dụng công thức lò xo có lực cản: `stiffness: 100, damping: 20` để tạo cảm giác cơ học cao cấp.
*   **Cascade Waterfall**: Các danh sách bài đọc hôm nay không xuất hiện đồng loạt mà trượt nhẹ lên từ dưới theo hiệu ứng thác đổ (Waterfall) so lệch 50ms giữa các phần tử.

---

## 7. Anti-Patterns (Quy tắc cấm tuyệt đối)

*   **Cấm dùng Emojis** trong các văn bản giao diện học tập chuyên nghiệp (Trừ icon ngọn lửa Streak 🔥 và cúp 🏆 đã được đặc tả).
*   **Cấm dùng màu đen tuyệt đối (`#000000`)** cho chữ hoặc nền.
*   **Cấm viết copywriter sáo rỗng**: Tránh các từ ngữ AI hay dùng như *"Seamless"*, *"Elevate"*, *"Unleash"*, *"Next-gen"*.
*   **Cấm dùng hình ảnh stock lỗi link**: Luôn bọc ảnh dự phòng mặc định bằng avatar SVG hoặc hình ảnh từ Picsum.
