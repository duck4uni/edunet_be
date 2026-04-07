import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedChatbotData1775520005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const chatDataValues = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Quy trình đăng ký khóa học',
        content: `Quy trình đăng ký khóa học gồm các bước sau:
1. Đăng nhập vào hệ thống EduNet
2. Tìm kiếm khóa học muốn học
3. Xem thông tin chi tiết khóa học
4. Nhấp nút "Đăng ký" 
5. Chọn hình thức thanh toán
6. Hoàn tất thanh toán
7. Bắt đầu học ngay sau khi thanh toán thành công`,
        fileType: 'text',
        htmlContent: null,
        imageCount: 0,
        date: 'Ngày 07/04/2026',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'Chính sách hoàn tiền',
        content: `Chính sách hoàn tiền của EduNet:
- Hoàn tiền 100% nếu yêu cầu trong vòng 7 ngày sau khi mua
- Hoàn tiền 50% nếu yêu cầu từ ngày 8-14 sau khi mua
- Không hoàn tiền sau 14 ngày
- Hoàn tiền sẽ được xử lý trong vòng 3-5 ngày làm việc
- Không hoàn tiền nếu đã hoàn thành hơn 50% khóa học`,
        fileType: 'text',
        htmlContent: null,
        imageCount: 0,
        date: 'Ngày 07/04/2026',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        title: 'Cách sử dụng bảng điều khiển học tập',
        content: `Bảng điều khiển (Dashboard) giúp bạn quản lý quá trình học:
- Xem tiến độ các khóa học đang học
- Theo dõi điểm số và bài kiểm tra
- Xem lịch biểu các buổi học trực tuyến
- Tải tài liệu học tập
- Gửi bài tập cho giáo viên
- Xem phản hồi từ giáo viên
- Tham gia các diễn đàn thảo luận`,
        fileType: 'text',
        htmlContent: null,
        imageCount: 0,
        date: 'Ngày 07/04/2026',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        title: 'Hướng dẫn nộp bài tập',
        content: `Quy trình nộp bài tập trên EduNet:
1. Vào khóa học và tìm mục "Bài tập"
2. Chọn bài tập cần nộp
3. Đọc kỹ yêu cầu của bài tập
4. Soạn bài tập hoặc tải file lên
5. Nhập ghi chú nếu cần
6. Nhấp "Nộp bài" để gửi
7. Theo dõi trạng thái nộp bài (đang chấm, đã chấm)
8. Xem nhận xét của giáo viên`,
        fileType: 'text',
        htmlContent: null,
        imageCount: 0,
        date: 'Ngày 07/04/2026',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        title: 'Giải quyết vấn đề kết nối',
        content: `Nếu bạn gặp vấn đề kết nối mạng khi học:
1. Kiểm tra kết nối internet của bạn
2. Thử kết nối lại Wi-Fi hoặc mạng di động
3. Xóa bộ nhớ đệm của trình duyệt
4. Cập nhật trình duyệt lên phiên bản mới nhất
5. Thử sử dụng trình duyệt khác
6. Nếu vấn đề vẫn còn, hãy liên hệ với bộ phận hỗ trợ
Email: support@edunet.com
Phone: 1800-1234`,
        fileType: 'text',
        htmlContent: null,
        imageCount: 0,
        date: 'Ngày 07/04/2026',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440006',
        title: 'Các tính năng nâng cao',
        content: `EduNet cung cấp các tính năng nâng cao:
- Học offline: Tải bài học để xem sau này
- Phụ đề: Hỗ trợ nhiều ngôn ngữ
- Lớp học trực tuyến: Tham gia lớp học cùng giáo viên
- Chat với giáo viên: Hỏi đáp trực tiếp
- Bảng xếp hạng: So sánh tiến độ với học viên khác
- Giấy chứng chỉ: Cấp giấy khi hoàn thành khóa học
- API tích hợp: Dành cho doanh nghiệp`,
        fileType: 'text',
        htmlContent: null,
        imageCount: 0,
        date: 'Ngày 07/04/2026',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440007',
        title: 'Yêu cầu hệ thống',
        content: `Yêu cầu tối thiểu để sử dụng EduNet:
Máy tính/Laptop:
- Hệ điều hành: Windows 7+, macOS 10.12+, hoặc Linux
- RAM: 2GB trở lên
- Trình duyệt: Chrome 60+, Firefox 55+, Safari 11+, Edge
- Tốc độ internet: 1Mbps trở lên

Điện thoại/Tablet:
- iOS 10+ hoặc Android 5+
- RAM: 1GB trở lên
- Ứng dụng: Cài đặt ứng dụng EduNet từ App Store hoặc Play Store`,
        fileType: 'text',
        htmlContent: null,
        imageCount: 0,
        date: 'Ngày 07/04/2026',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440008',
        title: 'Liên hệ hỗ trợ',
        content: `Thông tin liên hệ bộ phận hỗ trợ khách hàng EduNet:
Email: support@edunet.com
Chat trực tuyến: Mở ứng dụng và chọn "Hỗ trợ" > "Chat"
Đường dây nóng: 1800-1234 (miễn phí)
Giờ làm việc: Thứ 2 - Chủ Nhật, 8:00 AM - 10:00 PM
Website: https://support.edunet.com

Bộ phận hỗ trợ sẽ trả lời trong vòng 2 giờ vào giờ làm việc.`,
        fileType: 'text',
        htmlContent: null,
        imageCount: 0,
        date: 'Ngày 07/04/2026',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ];

    await queryRunner.query(
      `INSERT INTO "ChatData" (id, title, content, "fileType", "htmlContent", "imageCount", date, "createdAt", "updatedAt", "deletedAt") 
       VALUES ${chatDataValues.map((_, idx) => `($${idx * 10 + 1}, $${idx * 10 + 2}, $${idx * 10 + 3}, $${idx * 10 + 4}, $${idx * 10 + 5}, $${idx * 10 + 6}, $${idx * 10 + 7}, $${idx * 10 + 8}, $${idx * 10 + 9}, $${idx * 10 + 10})`).join(', ')}`,
      chatDataValues.flatMap((item) => [
        item.id,
        item.title,
        item.content,
        item.fileType,
        item.htmlContent,
        item.imageCount,
        item.date,
        item.createdAt,
        item.updatedAt,
        item.deletedAt,
      ]),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "ChatData" WHERE id IN (
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
      '550e8400-e29b-41d4-a716-446655440003',
      '550e8400-e29b-41d4-a716-446655440004',
      '550e8400-e29b-41d4-a716-446655440005',
      '550e8400-e29b-41d4-a716-446655440006',
      '550e8400-e29b-41d4-a716-446655440007',
      '550e8400-e29b-41d4-a716-446655440008'
    )`);
  }
}
