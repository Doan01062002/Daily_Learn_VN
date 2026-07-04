# DAILY LEARN VN
## Tài liệu Đặc tả Yêu cầu Sản phẩm (Product Requirement Document - PRD)

- **Phiên bản:** 1.0 (MVP Scope)
- **Tác giả:** Senior PM & Technical Product Analyst
- **Đối tượng sử dụng:** Full-stack Developer, UI/UX Designer, Investors
- **Lĩnh vực tập trung:** Công nghệ / Lập trình, Kinh doanh (Business), Kỹ năng mềm
- **Ngày khởi tạo:** 30 tháng 06 năm 2026

---

## 1. TÓM TẮT SẢN PHẨM (PRODUCT EXECUTIVE SUMMARY)

### 1.1. Tổng quan sản phẩm
**Daily Learn VN** là một nền tảng Web App tối ưu hóa trải nghiệm trên thiết bị di động (Mobile-first Responsive Web App) áp dụng triết lý học tập tinh gọn (Micro-learning). Nền tảng tận dụng sức mạnh của trí tuệ nhân tạo (Gemini API) thông qua mô hình kiểm duyệt bán tự động (Human-in-the-loop) nhằm thu thập, cô đọng các nguồn tri thức, xu hướng công nghệ, kinh doanh và kỹ năng mềm thành các bài học kéo dài từ 5 đến 10 phút hằng ngày bằng tiếng Việt, giúp cá nhân hóa luồng phân phối dựa trên mục tiêu và trình độ người học.

### 1.2. Vấn đề giải quyết
- **Sự quá tải thông tin (Information Overload):** Mỗi ngày có hàng triệu bài viết, video, nghiên cứu được xuất bản. Người học không biết đâu là nguồn thông tin chất lượng, chính xác và có giá trị áp dụng thực tiễn.
- **Rào cản thời gian và sự kiên trì:** Các khóa học truyền thống trên Coursera, Udemy thường kéo dài hàng chục giờ với lượng lý thuyết nặng nề. Tỷ lệ hoàn thành các khóa học này trên toàn cầu chỉ đạt dưới 10%, do người học bận rộn và nhanh nản lòng.
- **Học vẹt, thiếu tính thực hành:** Đa số các ứng dụng tóm tắt sách hiện tại chỉ dừng lại ở việc cung cấp lý thuyết chung chung, vĩ mô, khiến người dùng rơi vào bẫy "ảo tưởng tri thức" mà không tạo ra kết quả thực tế.

### 1.3. Tại sao là bây giờ?
Thị trường lao động tại Việt Nam đang trải qua giai đoạn sàng lọc gắt gao. Nhu cầu nâng cấp kỹ năng liên tục (Up-skilling/Re-skilling) trở thành yếu tố bắt buộc để không bị đào thải. Đồng thời, sự phát triển vượt bậc của các mô hình ngôn ngữ lớn (LLM) như Gemini 1.5 Flash cung cấp khả năng xử lý ngôn ngữ tự nhiên vượt trội với chi phí cực thấp, mở ra cơ hội xây dựng một giải pháp đóng gói tri thức cá nhân hóa ở quy mô lớn mà trước đây không thể thực hiện được một cách thủ công.

---

## 2. PROBLEM STATEMENT (TUYÊN BỐ BÀI TOÁN)

### 2.1. Nỗi đau thực tế từ thị trường
Giải pháp học tập hiện tại chia làm 2 thái cực cực đoan: hoặc quá dài và nặng (khóa học trực tuyến, sách chuyên ngành), hoặc quá ngắn và mang tính giải trí độc hại, thiếu hệ thống (TikTok, YouTube Shorts). Người dùng Việt Nam đang thiếu một giải pháp trung hòa: vừa tiết kiệm thời gian, có hệ thống dữ liệu uy tín, lại vừa chỉ dẫn thực hành rõ ràng.

### 2.2. Hệ quả nếu không giải quyết
Người đi làm và sinh viên sẽ tiếp tục lãng phí hàng giờ đồng hồ lướt mạng xã hội vô định nhưng vẫn mang tâm lý lo âu bị tụt hậu (FOMO). Lực lượng lao động trẻ thiếu hụt các kỹ năng thực tế cần thiết để đáp ứng ngay yêu cầu của doanh nghiệp, gây lãng phí tài nguyên của cả cá nhân lẫn xã hội.

---

## 3. PERSONAS (CHÂN DUNG NGƯỜI DÙNG MỤC TIÊU)
Trong giai đoạn MVP, hệ thống tập trung giải quyết trọn vẹn bài toán cho 3 nhóm đối tượng cụ thể tại thị trường Việt Nam:

| TIÊU CHÍ | PERSONA 1: SINH VIÊN | PERSONA 2: DÂN VĂN PHÒNG | PERSONA 3: NGƯỜI TRÁI NGÀNH |
| :--- | :--- | :--- | :--- |
| **Mục tiêu chính** | Tích lũy kiến thức thực tế để đi thực tập hoặc kiếm việc ngay khi ra trường. Bắt kịp công nghệ mới mà nhà trường chưa kịp cập nhật. | Tối ưu hóa hiệu suất làm việc hiện tại, học tư duy Business để thăng tiến lên cấp quản lý. | Chuyển hướng sự nghiệp sang ngành Tech hoặc Business trong thời gian ngắn nhất; xây dựng CV có sản phẩm thực tế. |
| **Nỗi đau (Pain Points)** | Kiến thức giảng đường quá hàn lâm và lỗi thời. Ngân sách hạn hẹp không thể mua các khóa học đắt tiền. Bị ngợp giữa các lộ trình tự học. | Quá bận rộn, cạn kiệt năng lượng sau 8 tiếng ở công ty. Ngại đọc các tài liệu tiếng Anh dài dòng hoặc các báo cáo chuyên sâu phức tạp. | Thiếu hoàn toàn nền tảng căn bản, gặp thuật ngữ chuyên ngành là nản. Sợ học sai hướng mất thời gian, sợ mình quá tuổi. |
| **Hành vi tiêu thụ** | Quen thuộc với nội dung ngắn trên mạng xã hội. Thường chỉ học tập trung cao độ khi sát kỳ thi hoặc mùa tuyển dụng. | Tranh thủ học 10-15 phút vào giờ nghỉ trưa hoặc khi di chuyển bằng xe công nghệ. Thích các mẹo, thủ thuật (hacks) dùng được ngay. | Dành 1-2 tiếng buổi tối để tự học nhưng tiến độ chậm do không có người hướng dẫn. Thường xuyên tìm kiếm các bài viết định hướng. |
| **Trigger sử dụng** | Thấy bạn bè xung quanh tìm được job ngon, hoặc đọc tin tuyển dụng thấy yêu cầu công nghệ mình chưa từng nghe tới. | Gặp bế tắc trong một task công việc thực tế được giao, hoặc khi sếp yêu cầu tối ưu hóa quy trình bằng công cụ mới (như AI). | Cảm thấy chán ghét công việc hiện tại, áp lực kinh tế, hoặc đọc các bài viết chia sẻ mức lương nghìn đô của ngành mong muốn. |
| **Rào cản chuyển đổi** | Độ nhạy cảm về giá cực kỳ cao. Thích các giải pháp hoàn toàn miễn phí hoặc giá học sinh. | Tâm lý lười biếng, ngại phải tiếp tục vận động não bộ sau một ngày làm việc căng thẳng. | Nỗi sợ hãi thất bại, sợ khó, không tin tưởng vào việc học online 5-10 phút có thể giúp chuyển ngành. |
| **Insight cốt lõi** | "Tôi muốn học những gì doanh nghiệp cần ngay bây giờ, nhưng bài học phải ngắn, dễ nuốt và không tốn quá nhiều chi phí." | "Đừng bắt tôi đọc cả cuốn sách. Hãy chỉ cho tôi xu hướng mới nhất là gì và cách áp dụng nó để giải quyết công việc ngày mai." | "Tôi cần một lộ trình cực kỳ rõ ràng, giải thích thuật ngữ như cho một đứa trẻ và giúp tôi làm được sản phẩm thực tế để tự tin nộp CV." |

---

## 4. USER JOURNEY (HÀNH TRÌNH NGƯỜI DÙNG)
Thiết kế trải nghiệm người dùng tập trung vào việc giảm thiểu ma sát ở giai đoạn Onboarding và đẩy mạnh phần thưởng tâm lý (Quick Win) ngay trong bài học đầu tiên.

| GIAI ĐOẠN | USER ACTION | USER THOUGHT | EMOTION | PRODUCT OPPORTUNITY |
| :--- | :--- | :--- | :--- | :--- |
| **1. Awareness** | Bấm vào link đăng ký từ Landing Page (Waitlist) được chia sẻ trên các cộng đồng Facebook/LinkedIn. | "Tóm tắt kiến thức học trong 5 phút lại có hướng dẫn thực hành? Để đăng ký thử xem sao." | Tò mò, hy vọng | Tối ưu hóa thông điệp Landing Page đánh mạnh vào USP: "Học ít - Hiểu sâu - Hành động ngay". Hoàn thiện phễu thu thập Email. |
| **2. Signup & Onboarding** | Nhấp vào liên kết kích hoạt, Đăng nhập qua Google (1-click), chọn Persona, chọn Chủ đề quan tâm và Trình độ hiện tại. | "Mong là không bắt nhập form dài dòng. Chọn nhanh vài nút để xem giao diện lộ trình cá nhân thế nào." | Hơi hoài nghi, mong muốn nhanh gọn | **Giảm ma sát tuyệt đối:** Không sử dụng ô nhập văn bản (text input), thiết kế 100% dạng nút bấm trực quan. Lưu cấu hình onboarding vào database. |
| **3. Daily Learning** | Truy cập Dashboard chính, đọc bài học duy nhất được phân phối trong ngày, thực hiện chỉ dẫn thực hành, trả lời 3 câu Quiz. | "Bài viết ngắn gọn, không lan man. Phần thực hành prompt AI này dùng được luôn này. Làm Quiz đúng hết rồi, dễ hiểu!" | Thỏa mãn, tự tin (Quick Win) | Thiết kế giao diện đọc bài tối giản (Clean UI). Phần "Thực hành" phải đem lại kết quả hữu hình ngay lập tức (ví dụ: copy câu lệnh chạy ra kết quả). |
| **4. Retention** | Nhìn thấy chỉ số Streak tăng lên, thấy tên mình thăng hạng trên Bảng xếp hạng tuần, nhận thông báo nhắc nhở vào ngày hôm sau. | "Mình đã duy trì học được 4 ngày liên tiếp rồi, ráng giữ phong độ không uổng phí. Để xem tuần này mình đứng thứ mấy." | Hào hứng, có tính cam kết | Xây dựng logic tính toán Streak real-time mượt mà. Đẩy thông báo nhắc nhở tự động qua Email vào các khung giờ cố định. |
| **5. Upgrade / Monetization** | Hết 3 ngày dùng thử, hệ thống hiển thị Paywall thông báo giới hạn tính năng AI hoặc giới hạn truy cập bài học chuyên sâu. | "Các bài học tuần qua thực sự giúp mình tăng năng suất công việc. Giá gói tháng bằng một ly trà sữa, xứng đáng đầu tư." | Cân nhắc lợi ích, sẵn sàng chi trả | Thiết kế trang Paywall minh bạch. Tích hợp hiển thị VietQR tự động định danh mã chuyển khoản giúp tối ưu luồng thanh toán thủ công. |

---

## 5. SCOPE MVP (PHẠM VI SẢN PHẨM)
Để đảm bảo một lập trình viên Full-stack có thể tự xây dựng và vận hành hệ thống trong vòng 4 - 6 tuần, phạm vi tính năng được phân định nghiêm ngặt theo mô hình MoSCoW dưới đây:

### 5.1. Bảng phân định tính năng theo MoSCoW
| MUST HAVE (BẮT BUỘC PHẢI CÓ) | SHOULD HAVE (NÊN CÓ NẾU KỊP) | COULD HAVE (CÓ THỂ BỔ SUNG SAU) | WON'T HAVE (KHÔNG LÀM TRONG MVP) |
| :--- | :--- | :--- | :--- |
| - Đăng nhập Google OAuth 2.0 (1-click).<br>- Luồng Onboarding cấu hình Topic, Level.<br>- Dashboard hiển thị bài học hằng ngày dựa theo bộ lọc.<br>- Bài học chuẩn: Tóm tắt + Thực hành + 3 câu Quiz.<br>- Hệ thống tích lũy XP và tính toán chỉ số Streak.<br>- Admin Panel cho phép nhập liệu và gọi Gemini API sinh bản nháp bài học.<br>- Cổng thanh toán thủ công bằng hiển thị mã VietQR. | - Hệ thống gửi Email tự động nhắc nhở học bài khi user sắp đứt Streak.<br>- Tính năng Bookmark (Lưu bài học để xem lại).<br>- Bảng xếp hạng (Leaderboard) Top 20 người dùng có XP cao nhất tuần.<br>- Thuật toán gợi ý thông minh bài học tiếp theo dựa trên lịch sử học cùng chủ đề. | - Giao diện tối mờ (Dark mode).<br>- Cho phép người dùng tự dán link bất kỳ để AI tóm tắt riêng (tính năng cá nhân nâng cao).<br>- Chia sẻ thành tích học tập trực tiếp lên Facebook/LinkedIn bằng ảnh tự động tạo.<br>- Hệ thống đổi điểm XP tích lũy lấy các phần quà thực tế (vouchers). | - Phát triển Native App ứng dụng công nghệ iOS/Android.<br>- Hệ thống cổng thanh toán tự động quốc tế (Stripe, Paypal).<br>- Hệ thống Chat bot AI tương tác giải đáp trực tiếp trong bài học.<br>- Diễn đàn thảo luận (Forum/Community) giữa các người học. |

---

## 6. FUNCTIONAL REQUIREMENTS (YÊU CẦU CHỨC NĂNG)
Các yêu cầu chức năng dưới đây được đặc tả chi tiết, có thể kiểm thử (testable) và phục vụ trực tiếp cho việc thiết kế database cũng như viết code logic backend.

### 6.1. Module Đăng ký / Đăng nhập & Onboarding (FR-01)
- **Yêu cầu:** Hệ thống chỉ cho phép đăng nhập duy nhất qua Google OAuth 2.0 để giảm thiểu rủi ro bảo mật và thời gian phát triển module quản lý mật khẩu.
- **Luồng xử lý:** Nếu Email người dùng chưa tồn tại trong bảng `users`, tiến hành tạo mới user với role mặc định là `STUDENT` và chuyển hướng ngay lập tức sang màn hình Onboarding. Nếu đã tồn tại, kiểm tra trạng thái profile và chuyển về Dashboard chính.
- **Dữ liệu Onboarding:** Phải lưu trữ chính xác 3 trường thông tin: `interested_topics` (Mảng string), `current_level` (String: Beginner/Experienced), và `daily_time_commitment` (Integer: 5/10/15).

### 6.2. Module Phân phối Bài học - Home Feed (FR-02)
- **Yêu cầu:** Mỗi ngày sau 00:00, khi người dùng truy cập trang chủ, hệ thống dựa vào `interested_topics` và `current_level` của họ để query từ bảng `lessons` ra tối đa 3 bài học phù hợp chưa được học.
- **Cấu trúc dữ liệu bài học hiển thị:**
  - Tiêu đề bài học (Dưới 100 ký tự).
  - Tag danh mục (Ví dụ: #Javascript, #Growth_Hacking, #Communication).
  - Nguồn bài viết gốc (Domain nguồn để tôn trọng bản quyền).
  - Nội dung tóm tắt: Hiển thị dạng danh sách (bullet points) bằng định dạng Markdown.
  - Hành động ngay (Actionable Step): Đoạn văn hướng dẫn thực hành từng bước rõ ràng.

### 6.3. Module Quiz & Đánh giá hoàn thành bài học (FR-03)
- **Yêu cầu:** Cuối mỗi bài học bắt buộc có module Quiz gồm 3 câu hỏi trắc nghiệm để kiểm tra mức độ hiểu bài. Người dùng không thể nhấn nút hoàn thành nếu chưa trả lời Quiz.
- **Logic kiểm tra:** Người dùng chọn đáp án và bấm "Nộp bài". Hệ thống phản hồi ngay lập tức trạng thái Đúng/Sai cho từng câu bằng hiệu ứng màu sắc kèm văn bản giải thích lý do (`explanation`).
- **Điều kiện vượt qua:** Người dùng phải trả lời đúng tối thiểu 2/3 câu hỏi.
  - *Nếu đạt:* Ghi nhận trạng thái `COMPLETED` vào bảng `user_lessons_progress`, cộng thêm 50 XP vào tài khoản, kích hoạt hiệu ứng chúc mừng trên giao diện và hiển thị nút "Gợi ý bài tiếp theo".
  - *Nếu không đạt:* Hiển thị nút "Học lại bài này" để reset trạng thái Quiz cho người dùng làm lại, không cộng điểm XP.

### 6.4. Module Quản lý Hệ thống Streak & Leaderboard (FR-04)
- **Yêu cầu Streak:** Khi người dùng đạt trạng thái `COMPLETED` bài học đầu tiên trong ngày (tính theo múi giờ GMT+7), hệ thống kiểm tra bản ghi ngày hôm trước. Nếu có bài học hoàn thành ngày hôm trước, `current_streak` tăng lên 1. Nếu ngày hôm trước không học, reset `current_streak` về 1. Nếu vượt qua `current_streak` cũ, cập nhật `max_streak`. Nếu hết ngày (sau 00:00) mà user không có bài học nào completed, `current_streak` tự động cập nhật về 0.
- **Yêu cầu Leaderboard:** Hệ thống sử dụng Redis Sorted Set để lưu trữ tổng điểm XP tích lũy của toàn bộ user trong tuần (từ 00:00 Thứ Hai đến 23:59 Chủ Nhật). Trang Bảng xếp hạng hiển thị Top 20 user có điểm số cao nhất kèm avatar Google và chỉ số Streak hiện tại của họ. Tự động clear set và reset về 0 vào đầu tuần mới.

### 6.5. Giao diện Admin Curation & Biên tập nội dung (FR-05)
- **Yêu cầu:** Giao diện bảo mật cao tại đường dẫn `/admin-portal`, chỉ cho phép tài khoản có trường `is_admin = true` truy cập. Đây là luồng hiện thực hóa tư duy "Human-in-the-loop".
- **Tính năng:** Admin cung cấp một văn bản thô hoặc nội dung cào về từ URL -> Bấm nút "AI Draft Generation" -> Hệ thống gọi API Gemini xử lý -> Trả về kết quả hiển thị lên các ô Input Form (Tiêu đề, Tóm tắt, Thực hành, 3 câu Quiz kèm đáp án và lời giải). Admin trực tiếp rà soát, chỉnh sửa các lỗi chính tả, thuật ngữ nếu có -> Bấm nút "Publish" để chính thức lưu vào database và đưa vào luồng phân phối cho người dùng.

---

## 7. NON-FUNCTIONAL REQUIREMENTS (YÊU CẦU PHI CHỨC NĂNG)

### 7.1. Hiệu năng hoạt động (Performance)
Ứng dụng phải được tối ưu hóa để có thời gian phản hồi ban đầu (Time to First Byte - TTFB) dưới 500ms. Chỉ số tải trang hoàn chỉnh (First Contentful Paint) trên thiết bị di động sử dụng mạng 3G/4G tại Việt Nam không được vượt quá 1.5 giây. Toàn bộ hình ảnh (nếu có) phải được nén tự động dưới định dạng WebP và áp dụng kỹ thuật Lazy Loading.

### 7.2. Khả năng mở rộng & Di động (Scalability & Mobile-first)
Kiến trúc database phải chịu tải được tối thiểu 10,000 người dùng hoạt động hằng tháng (MAU) mà không gây trễ hoặc nghẽn truy vấn. Giao diện người dùng bắt buộc phải tuân thủ triệt để tư duy Mobile-first: toàn bộ các tương tác cốt lõi nằm trong vùng di chuyển tự nhiên của ngón cái (Thumb-zone), kích thước các nút bấm tối thiểu đạt 44x44px nhằm hạn chế tối đa việc bấm nhầm.

### 7.3. Bảo mật dữ liệu (Security)
Toàn bộ các API Endpoints phải được mã hóa qua giao thức HTTPS. Token xác thực JWT sau khi người dùng đăng nhập qua Google phải được lưu trữ an toàn trong HttpOnly Cookie để triệt tiêu hoàn toàn nguy cơ bị tấn công đánh cắp token qua lỗ hổng XSS. API của Admin phải được bảo vệ bằng lớp Middleware kiểm tra quyền nghiêm ngặt từ phía server.

---

## 8. AI REQUIREMENTS & QUY TRÌNH KIỂM SOÁT CHẤT LƯỢNG

### 8.1. Chiến lược giảm thiểu chi phí API tối đa (Pre-computed Strategy)
> [!IMPORTANT]
> **NGUYÊN TẮC CỐT LÕI:** Tuyệt đối KHÔNG gọi Gemini API trực tiếp từ phía client của người dùng cuối, và KHÔNG sinh nội dung động cho từng user khi họ mở bài học.

Để đưa chi phí vận hành AI về mức tiệm cận bằng 0 trong giai đoạn thử nghiệm, hệ thống áp dụng chiến lược Pre-computed: AI chỉ được gọi duy nhất 1 lần tại màn hình Admin khi biên tập bài học mới. Dữ liệu sau khi Admin phê duyệt sẽ lưu trữ dưới dạng Static Data trong PostgreSQL. Hàng ngàn người dùng sau đó chỉ đọc dữ liệu tĩnh này từ database, giúp kiểm soát hoàn toàn bài toán chi phí gọi API và loại bỏ hoàn toàn rủi ro người dùng spam phá hoại hệ thống.

### 8.2. Quy trình Prompt Engineering ngăn chặn bói toán (Anti-Hallucination)
Hệ thống sử dụng model `gemini-1.5-flash` nhờ ưu thế vượt trội về tốc độ xử lý và chi phí cực rẻ. Cấu trúc System Prompt gửi lên API được thiết kế đóng khung ngữ cảnh nghiêm ngặt:

```text
[SYSTEM PROMPT]
Bạn là một chuyên gia giáo dục đỉnh cao chuyên về phương pháp Micro-learning. Nhiệm vụ của bạn là chuyển đổi tài liệu đầu vào (CONTEXT) thành một bài học tinh gọn bằng Tiếng Việt, thời gian tiêu thụ không quá 5 phút, tập trung mạnh vào tính hành động.

[QUY TẮC CHỐNG BỊA ĐẶT - ANTL-HALLUCINATION]
1. CHỈ ĐƯỢC PHÉP trích xuất tri thức có nguồn gốc rõ ràng trực tiếp từ đoạn CONTEXT được cung cấp dưới đây. Tuyệt đối không tự ý thêm thắt số liệu, không suy diễn logic nằm ngoài tài liệu, không sử dụng kiến thức bên ngoài hệ thống.
2. Nếu dữ liệu trong CONTEXT không đủ cấu thành 3 câu hỏi Quiz chất lượng hoặc không có chỉ dẫn thực hành rõ ràng, hãy trả về chính xác chuỗi mã lỗi: "ERR_INSUFFICIENT_CONTEXT". Tuyệt đối không tự bịa thông tin.
3. Câu chữ trả về phải ngắn gọn, súc tích, mang văn phong chuyên nghiệp, dễ hiểu cho người Việt.

[ĐỊNH DẠNG ĐẦU RA MANDATORY JSON]
Trả về một JSON Object duy nhất, không kèm theo bất kỳ ký tự Markdown nào bên ngoài khối JSON. Cấu trúc JSON bắt buộc như sau:
{
  "title": "Tiêu đề bài học (dưới 100 ký tự)",
  "summary": [
    "Ý chính cốt lõi thứ nhất (dưới 150 ký tự)",
    "Ý chính cốt lõi thứ hai (dưới 150 ký tự)",
    "Ý chính cốt lõi thứ ba (dưới 150 ký tự)"
  ],
  "actionable_step": "Hướng dẫn chi tiết từng bước để người dùng thực hành áp dụng được ngay kiến thức vừa học vào thực tế trong vòng 5 phút.",
  "quizzes": [
    {
      "question": "Nội dung câu hỏi trắc nghiệm kiểm tra ý chính 1",
      "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      "correct_answer": "Đáp án đúng chính xác (phải trùng khớp hoàn toàn với 1 trong 4 lựa chọn trên)",
      "explanation": "Lời giải thích ngắn gọn tại sao đáp án này đúng dựa trên tài liệu gốc"
    }
  ]
}

[CONTEXT]
{Dữ liệu thô được truyền từ Admin Panel}
```

---

## 9. UX / WIREFRAME NOTES (GHI CHÚ TRẢI NGHIỆM NGƯỜI DÙNG)

### 9.1. Các màn hình chính và Luồng tương tác cốt lõi
1. **Màn hình Landing Page (Phễu Waitlist):** Giao diện cực kỳ tối giản. Phía trên là dòng tiêu đề lớn đánh trực tiếp vào nỗi đau (Ví dụ: "Học 5 phút mỗi ngày, làm chủ công nghệ mới, nói không với tụt hậu"). Ngay phía dưới là ô điền Email kèm nút CTA nổi bật màu xanh ngọc: "Tham gia danh sách chờ (Miễn phí)". Tiếp theo là một bảng so sánh ngắn giữa phương pháp Micro-learning của Daily Learn VN và lối học truyền thống nặng nề.
2. **Màn hình Onboarding Wizard:** Thiết kế dạng thẻ trượt (Card wizard) để giảm tải nhận thức. Mỗi màn hình chỉ hiển thị duy nhất một câu hỏi trắc nghiệm với các nút lựa chọn lớn. Thanh tiến trình (Progress Bar) chạy liên tục ở phía trên cùng để người dùng biết họ đã hoàn thành bao nhiêu phần trăm, giúp giảm tỷ lệ bỏ cuộc (Drop-off rate) giữa chừng.
3. **Màn hình Dashboard trung tâm (Home Feed):**
   - **Khu vực Header:** Hiển thị Avatar người dùng bên góc phải, bên góc trái là Icon ngọn lửa biểu thị chỉ số Streak hiện tại kèm tổng điểm XP.
   - **Khu vực Trung tâm:** Một chiếc thẻ bài học lớn duy nhất của ngày hôm đó (Daily Feature Card). Trên thẻ hiển thị: Tên chủ đề bài học, Thời gian đọc ước tính (ví dụ: 5 phút), Huy hiệu độ khó (Beginner/Advanced). Giữa thẻ là nút CTA lớn nhất màn hình: **"Bắt đầu học ngay"**.
   - **Khu vực Bottom Nav Bar:** Ghim cố định dưới cùng màn hình với 3 Tab chính: Bài học (Icon Home), Bảng xếp hạng (Icon Trophy), Tài khoản (Icon User).
4. **Màn hình Giao diện Bài học (Reading Screen):** Sử dụng font chữ không chân dãn dòng rộng, kích thước chữ tối thiểu 16px giúp người dùng không mỏi mắt khi đọc trên điện thoại. Phần nội dung "Hành động ngay" bắt buộc phải nằm trong một khối hộp (Container) bo góc có màu nền tương phản nhẹ (ví dụ: màu vàng kem nhạt hoặc xanh mint nhạt) nhằm định hình thị giác của người học, nhấn mạnh tầm quan trọng của việc thực hành.

---

## 10. DATA / METRICS (HỆ THỐNG CHỈ SỐ ĐO LƯỜNG)
Để theo dõi sát sao tiến độ đạt mục tiêu 1,000 người đăng ký và duy trì tỷ lệ Retention Day-7 ở mức 30%, các chỉ số sản phẩm được thiết lập và theo dõi qua bảng quản trị sau:

| LOẠI CHỈ SỐ | TÊN CHỈ SỐ | ĐỊNH NGHĨA / CÁCH TÍNH TOÁN | MỤC TIÊU MVP |
| :--- | :--- | :--- | :--- |
| **North Star Metric** | Weekly Completed Lessons (WCL) | Tổng số bài học mà toàn bộ hệ thống hoàn thành xuất sắc (vượt qua bài Quiz với điểm số >= 2/3) trong vòng 1 tuần. Đo lường trực tiếp giá trị thực tế mà sản phẩm mang lại cho người dùng. | **> 3,000 bài/tuần** |
| **Activation** | Onboarding Activation Rate | Tỷ lệ phần trăm số tài khoản đăng ký mới thực hiện hoàn thành trọn vẹn luồng Onboarding và vượt qua bài Quiz của bài học đầu tiên ngay trong ngày đăng ký. | **> 65%** |
| **Retention** | Day-7 Retention Rate | Tỷ lệ người dùng đăng ký vào ngày N, có quay trở lại mở ứng dụng và thực hiện hành động học tập vào chính xác ngày N+7. Chỉ số cốt lõi chứng minh tính bền vững của thói quen. | **30% (Cam kết)** |
| **Engagement** | DAU / MAU Ratio | Tỷ lệ lượng người dùng hoạt động hằng ngày chia cho lượng người dùng hoạt động hằng tháng. Đo lường mức độ "gắn kết" và tần suất sử dụng sản phẩm của tệp khách hàng. | **> 40%** |
| **Learning Quality** | First-Time Quiz Pass Rate | Tỷ lệ người học vượt qua bài kiểm tra Quiz ngay trong lần bấm nộp bài đầu tiên. Giúp đội ngũ đánh giá độ khó và tính dễ hiểu của nội dung do AI tạo ra. | **70% - 80%** |
| **Monetization** | Trial-to-Paid Conversion Rate | Tỷ lệ người dùng thực hiện chuyển khoản ngân hàng nâng cấp lên gói Premium sau khi kết thúc thời hạn 3 ngày trải nghiệm tính năng miễn phí ban đầu. | **2% - 5%** |

---

## 11. RISKS & MITIGATIONS (QUẢN TRỊ RỦI RO)

### 11.1. Rủi ro sụt giảm tỷ lệ giữ chân người dùng (Retention Drop Risk)
- **Nguy cơ:** Người dùng hào hứng đăng ký trong 1-2 ngày đầu, sau đó do bận rộn hoặc quên lãng dẫn đến đứt Streak, nản lòng và rời bỏ ứng dụng hoàn toàn.
- **Cách giảm thiểu:** Xây dựng hệ thống Cron-job tự động quét database vào lúc 12:00 trưa hằng ngày. Hệ thống sẽ tự động gửi một Email nhắc nhở cá nhân hóa đến những user chưa hoàn thành bài học trong ngày với tiêu đề kích thích: *"Đoan ơi, chuỗi 5 ngày học liên tiếp của bạn sắp bị dập tắt! Dành ra đúng 5 phút giờ nghỉ trưa để bảo vệ Streak ngay"*.

### 11.2. Rủi ro nội dung AI kém chất lượng hoặc sai lệch (AI Quality Risk)
- **Nguy cơ:** Model AI dịch thuật thuật ngữ chuyên ngành ngô nghê, câu chữ lủng củng hoặc tạo ra đáp án Quiz sai lệch gây ức chế cho người học.
- **Cách giảm thiểu:** Triệt tiêu bằng cách kiên quyết áp dụng mô hình **Human-in-the-loop (Option B)** cho MVP. Bạn đóng vai trò là chốt chặn cuối cùng kiểm duyệt nội dung. AI chỉ làm trợ lý soạn thảo bản nháp, nội dung hiển thị tới người dùng được cam kết chính xác và chất lượng 100% nhờ vào khâu kiểm duyệt thủ công của Admin.

### 11.3. Rủi ro người dùng gian lận điểm số (Gamification Gaming Risk)
- **Nguy cơ:** Người học không đọc bài viết, vào chọn bừa các đáp án Quiz nhiều lần cho đến khi đúng để ăn điểm XP và thăng hạng đua top bảng xếp hạng giả tạo.
- **Cách giảm thiểu:** Trong giai đoạn MVP, để giảm thiểu độ phức tạp khi code backend, chúng ta chấp nhận để lỏng cơ chế tự giác. Tuy nhiên, bổ sung một ràng buộc kỹ thuật đơn giản: Mỗi bài học chỉ cho phép nộp lại bài Quiz tối đa 3 lần trong ngày. Nếu trượt cả 3 lần, bài học đó khóa trạng thái và user phải đợi tới ngày hôm sau mới được làm lại để tính điểm Streak.

---

## 12. TECH CONSIDERATIONS (ĐỊNH HƯỚNG KIẾN TRÚC CHO DEVELOPER)

### 12.1. Đề xuất Tech Stack tinh gọn, tốc độ cao cho MVP
- **Full-stack Framework:** Next.js (App Router, Tailwind CSS). Việc sử dụng Next.js cho phép bạn vừa xây dựng giao diện Landing Page chuẩn SEO tối ưu tốc độ bằng cơ chế Server-side Rendering (SSR), vừa viết các API Routes trực tiếp ở thư mục backend mà không cần cấu hình một server Node.js độc lập phức tạp. Deploy sản phẩm cực nhanh và hoàn toàn miễn phí giai đoạn đầu lên nền tảng Vercel.
- **Backend API Service (Tùy chọn mở rộng dài hạn):** NestJS (TypeScript) hoặc Java Spring Boot. Nếu bạn muốn tách biệt mã nguồn để đảm bảo tính module hóa cao, NestJS là sự lựa chọn hoàn hảo vì dùng chung ngôn ngữ TypeScript với Frontend, giúp đẩy nhanh tốc độ code và dễ dàng map dữ liệu. Nếu hệ thống cần xử lý hàng đợi (Queue) cào bài quy mô lớn và đồng bộ dữ liệu nặng, Spring Boot mang lại sự vững chắc tuyệt đối về mặt kiến trúc.
- **Database chính:** PostgreSQL. Lưu trữ dữ liệu quan hệ chặt chẽ, tối ưu truy vấn kết hợp giữa thông tin người dùng, tiến độ bài học và lịch sử Streak.
- **Caching & Bảng xếp hạng:** Redis. Sử dụng cấu trúc dữ liệu `Sorted Set (ZSET)` nguyên bản của Redis giúp bạn hiện thực hóa tính năng Bảng xếp hạng tuần (Leaderboard) chỉ với một vài dòng lệnh, đạt hiệu năng query cực cao mà không gây áp lực tải lên database PostgreSQL chính.

### 12.2. Kiến trúc luồng dữ liệu tổng quan
Hệ thống vận hành theo cơ chế phân tách luồng tạo nội dung và luồng tiêu thụ nội dung:
- **Luồng Admin (Đầu vào):** Admin Input URL -> Node.js Backend -> Gửi request tới Gemini API -> Nhận cấu trúc JSON -> Lưu trạng thái Draft -> Admin Edit & Phê duyệt -> Commit vào PostgreSQL.
- **Luồng Người dùng (Đầu ra):** Client Next.js App -> Request API Route -> Đọc dữ liệu tĩnh trực tiếp từ PostgreSQL/Redis Cache -> Trả kết quả hiển thị lên màn hình người dùng. Đảm bảo tốc độ tải trang tức thì và chi phí API bằng 0.

---

## 13. PRODUCT ROADMAP (LỘ TRÌNH PHÁT TRIỂN SẢN PHẨM)
Lộ trình phát triển được chia làm 3 giai đoạn rõ rệt nhằm tối ưu hóa nguồn lực của một lập trình viên solo-founder:

### 13.1. Giai đoạn 1: Tạo phễu thị trường (Tuần 1 - Tuần 2)
- **Mục tiêu:** Kiểm chứng mức độ quan tâm của thị trường Việt Nam đối với ý tưởng sản phẩm, tích lũy tệp người dùng tiềm năng ban đầu với chi phí marketing bằng 0.
- **Sản phẩm bàn giao (Deliverables):** Hoàn thiện trang Landing Page đăng ký Waitlist tích hợp hệ thống lưu trữ email tự động. Tiến hành viết các bài phân tích, chia sẻ kiến thức chất lượng cao đánh trúng nỗi đau trên các cộng đồng công nghệ, nhóm sinh viên, hội dân văn phòng để điều hướng người đọc về trang đăng ký. Mục tiêu thu thập tối thiểu 500 email chất lượng cao nằm trong danh sách chờ.

### 13.2. Giai đoạn 2: Phát hành MVP & Kiểm chứng độ giữ chân (Tuần 3 - Tuần 6)
- **Mục tiêu:** Ra mắt chính thức phiên bản Web App, đạt cột mốc 1,000 người dùng đăng ký chính thức và chứng minh được chỉ số Day-7 Retention đạt tối thiểu 30%.
- **Sản phẩm bàn giao (Deliverables):** Phát hành đầy đủ các module tính năng lõi thuộc nhóm Must-Have đã đặc tả ở mục 5. Triển khai Admin Panel phục vụ biên tập nội dung hằng ngày. Tích hợp tính năng hiển thị VietQR tĩnh tự động sinh mã chuyển khoản ngân hàng kèm mã nội dung định danh để triển khai mô hình Freemium (duyệt nâng cấp Premium bằng tay trong hệ thống Admin sau khi nhận được thông báo biến động số dư tài khoản).

### 13.3. Giai đoạn 3: Tự động hóa vận hành & Tăng trưởng doanh thu (Tháng thứ 2 trở đi)
- **Mục tiêu:** Giải phóng sức lao động thủ công của Admin, nâng cao tỷ lệ chuyển đổi dòng tiền tự động hóa hoàn toàn.
- **Sản phẩm bàn giao (Deliverables):**
  - Xây dựng script tự động cào dữ liệu (Auto-crawler bằng Python) định kỳ quét qua các RSS Feed, các blog công nghệ lớn (Medium, TechCrunch) và danh sách kênh YouTube uy tín được cấu hình sẵn để tự động nạp dữ liệu thô vào hàng đợi cho Gemini API xử lý tạo bản nháp liên tục. Admin chỉ mất 10 phút mỗi tuần để bấm duyệt hàng loạt bài học cho cả tuần tiếp theo.
  - Tích hợp các dịch vụ Open API ngân hàng (như PayOS hoặc Casso) để nhận Webhook thông báo biến động số dư real-time. Khi người dùng quét mã QR chuyển khoản đóng phí tháng, hệ thống tự động kích hoạt trạng thái tài khoản lên gói `PREMIUM` ngay lập tức mà không cần bất kỳ sự can thiệp thủ công nào của con người.

---

## 14. OPEN QUESTIONS (CÁC CÂU HỎI CHIẾN LƯỢC CẦN CHỐT)
Để tài liệu đạt độ hoàn thiện tối đa trước khi tiến hành thiết kế lược đồ cơ sở dữ liệu (Database Schema), có 2 câu hỏi lớn cần người sáng lập xác nhận hướng giải quyết:

1. **Vấn đề bản quyền nguồn dữ liệu thô (Copyright Laws):** Khi hệ thống thực hiện cào bài viết từ các tác giả hoặc trang báo lớn về để AI tóm tắt, chúng ta có nguy cơ gặp rắc rối pháp lý không?
   - *Gợi ý giải quyết từ PM:* Áp dụng luật Fair Use (Sử dụng hợp lý) bằng cách: Nội dung tóm tắt của AI là diễn đạt lại hoàn toàn bằng ngôn ngữ mới (tiếng Việt), đồng thời bắt buộc phải đính kèm một đường link nổi bật dẫn ngược về bài viết/video gốc của tác giả ở cuối bài học kèm nhãn: *"Nguồn tham khảo gốc: [Tên Tác Giả]"*. Việc này vừa giúp đem lại traffic cho tác giả gốc, vừa tăng tính uy tín, minh bạch cho dữ liệu của Daily Learn VN.
2. **Giới hạn độ khó của mục Thực hành (Actionable Steps):** Đối với lĩnh vực Công nghệ/Lập trình, phần thực hành 5 phút có nên tích hợp một trình biên dịch code online (như một terminal mini chạy trực tiếp trên web) không?
   - *Gợi ý giải quyết từ PM:* Tuyệt đối **KHÔNG** làm trong giai đoạn MVP để tránh rơi vào bẫy quá tải tính năng (Feature Creep) và phình to nợ kỹ thuật. Phần thực hành đối với lập trình trong MVP nên được thiết kế dưới dạng chỉ dẫn hành động phi kỹ thuật hoặc yêu cầu copy đoạn lệnh chạy thử trên máy cá nhân hoặc trên các môi trường cloud miễn phí có sẵn (như CodePen, StackBlitz) để tối giản hóa code core hệ thống.
