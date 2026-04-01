import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seed dữ liệu mẫu cho bảng Schedules:
 * - 10 schedule events linked to seeded courses & teachers
 * - Dates spread around NOW() so calendar & upcoming views have data
 * - Mix of types: class, exam, assignment, event
 */
export class SeedScheduleData1704000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "Schedules" (
        "id", "title", "description", "type", "date", "startTime", "endTime",
        "location", "meetingLink", "isOnline", "courseId", "teacherId",
        "createdAt", "updatedAt"
      )
      VALUES
        (
          'f0000000-0000-4000-8000-000000000001',
          'Buổi học React Hooks nâng cao',
          'Tìm hiểu sâu về useState, useEffect, useCallback, useMemo và custom hooks trong React.',
          'class',
          CURRENT_DATE + INTERVAL '1 day',
          '08:00:00', '10:00:00',
          NULL, 'https://meet.google.com/abc-defg-hij', true,
          'b0000000-0000-4000-8000-000000000001',
          '550e8400-e29b-41d4-a716-446655440002',
          NOW(), NOW()
        ),
        (
          'f0000000-0000-4000-8000-000000000002',
          'Kiểm tra giữa kỳ - TypeScript Fundamentals',
          'Bài kiểm tra 60 phút về TypeScript: interfaces, generics, enums, utility types.',
          'exam',
          CURRENT_DATE + INTERVAL '3 days',
          '09:00:00', '10:00:00',
          'Phòng 201 - Tòa nhà A', NULL, false,
          'b0000000-0000-4000-8000-000000000001',
          '550e8400-e29b-41d4-a716-446655440002',
          NOW(), NOW()
        ),
        (
          'f0000000-0000-4000-8000-000000000003',
          'Workshop Python - Pandas & Data Cleaning',
          'Thực hành xử lý dữ liệu thực tế với Pandas: missing values, outliers, data transformation.',
          'class',
          CURRENT_DATE + INTERVAL '2 days',
          '14:00:00', '16:30:00',
          NULL, 'https://zoom.us/j/1234567890', true,
          'b0000000-0000-4000-8000-000000000003',
          '550e8400-e29b-41d4-a716-446655440003',
          NOW(), NOW()
        ),
        (
          'f0000000-0000-4000-8000-000000000004',
          'Nộp bài tập - Xây dựng REST API',
          'Hạn nộp bài tập thực hành: thiết kế và triển khai REST API với Express.js & PostgreSQL.',
          'assignment',
          CURRENT_DATE + INTERVAL '5 days',
          '23:59:00', '23:59:00',
          NULL, NULL, false,
          'b0000000-0000-4000-8000-000000000002',
          '550e8400-e29b-41d4-a716-446655440002',
          NOW(), NOW()
        ),
        (
          'f0000000-0000-4000-8000-000000000005',
          'Seminar: Xu hướng AI trong giáo dục',
          'Sự kiện đặc biệt: thảo luận về ứng dụng AI trong e-learning, ChatGPT và Copilot.',
          'event',
          CURRENT_DATE + INTERVAL '7 days',
          '19:00:00', '21:00:00',
          'Hội trường lớn - Tầng 5', 'https://zoom.us/j/9876543210', true,
          NULL,
          '550e8400-e29b-41d4-a716-446655440003',
          NOW(), NOW()
        ),
        (
          'f0000000-0000-4000-8000-000000000006',
          'Buổi học UI/UX - Design System với Figma',
          'Xây dựng Design System hoàn chỉnh: colors, typography, spacing, components, auto layout.',
          'class',
          CURRENT_DATE,
          '10:00:00', '12:00:00',
          NULL, 'https://meet.google.com/xyz-uvwx-rst', true,
          'b0000000-0000-4000-8000-000000000004',
          '550e8400-e29b-41d4-a716-446655440002',
          NOW(), NOW()
        ),
        (
          'f0000000-0000-4000-8000-000000000007',
          'Thực hành Machine Learning - Scikit-learn',
          'Bài lab thực hành: Classification với Decision Tree, Random Forest và model evaluation.',
          'class',
          CURRENT_DATE + INTERVAL '4 days',
          '14:00:00', '17:00:00',
          NULL, 'https://zoom.us/j/1112223334', true,
          'b0000000-0000-4000-8000-000000000003',
          '550e8400-e29b-41d4-a716-446655440003',
          NOW(), NOW()
        ),
        (
          'f0000000-0000-4000-8000-000000000008',
          'Nộp Project MERN Stack - Milestone 1',
          'Hạn nộp milestone 1: Backend API hoàn chỉnh với authentication và CRUD operations.',
          'assignment',
          CURRENT_DATE + INTERVAL '10 days',
          '23:59:00', '23:59:00',
          NULL, NULL, false,
          'b0000000-0000-4000-8000-000000000006',
          '550e8400-e29b-41d4-a716-446655440002',
          NOW(), NOW()
        ),
        (
          'f0000000-0000-4000-8000-000000000009',
          'Kiểm tra cuối khóa - Digital Marketing',
          'Bài thi tổng hợp: SEO, Google Ads, Facebook Ads, Content Marketing, Analytics.',
          'exam',
          CURRENT_DATE + INTERVAL '14 days',
          '08:00:00', '10:00:00',
          'Phòng thi 301 - Tòa nhà B', NULL, false,
          'b0000000-0000-4000-8000-000000000005',
          '550e8400-e29b-41d4-a716-446655440003',
          NOW(), NOW()
        ),
        (
          'f0000000-0000-4000-8000-000000000010',
          'Buổi học Node.js - NestJS Architecture',
          'Modules, Controllers, Providers, Dependency Injection, Middleware, Guards, Pipes.',
          'class',
          CURRENT_DATE - INTERVAL '1 day',
          '09:00:00', '11:30:00',
          NULL, 'https://meet.google.com/nes-tjsx-abc', true,
          'b0000000-0000-4000-8000-000000000002',
          '550e8400-e29b-41d4-a716-446655440002',
          NOW(), NOW()
        )
      ON CONFLICT (id) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "Schedules" WHERE id LIKE 'f0000000-0000-4000-8000-%'`,
    );
  }
}
