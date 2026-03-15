import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seed dữ liệu cho bảng Teachers và Students
 * Tạo bản ghi tương ứng với các user đã seed ở SeedCourseData:
 * - 2 Teachers (teacher@edunet.com, teacher2@edunet.com)
 * - 1 Student (student@edunet.com)
 */
export class SeedTeachersAndStudents1741335100000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ==================== TEACHERS ====================
    await queryRunner.query(`
      INSERT INTO "Teachers" (
        id, "teacherId", specialization, qualification, experience,
        rating, "totalCourses", "totalStudents", status, bio,
        "socialLinks", earnings, "userId", "createdAt", "updatedAt"
      )
      VALUES
        (
          'f0000000-0000-4000-8000-000000000001',
          'TCH-001',
          'React,Node.js,TypeScript',
          'Thạc sĩ Công nghệ Thông tin',
          10,
          4.7, 4, 654, 'approved',
          '10 năm kinh nghiệm lập trình web. Chuyên gia React, Node.js và TypeScript.',
          '{"linkedin": "https://linkedin.com/in/teacher1", "website": "https://teacher1.dev"}',
          12500.00,
          '550e8400-e29b-41d4-a716-446655440002',
          NOW(), NOW()
        ),
        (
          'f0000000-0000-4000-8000-000000000002',
          'TCH-002',
          'Python,Data Science,Machine Learning',
          'Tiến sĩ Trí tuệ Nhân tạo',
          8,
          4.5, 4, 542, 'approved',
          'Tiến sĩ AI, 8 năm kinh nghiệm giảng dạy Data Science và Machine Learning.',
          '{"linkedin": "https://linkedin.com/in/teacher2", "twitter": "https://twitter.com/teacher2"}',
          9800.00,
          '550e8400-e29b-41d4-a716-446655440003',
          NOW(), NOW()
        )
      ON CONFLICT ("userId") DO NOTHING
    `);

    // ==================== STUDENTS ====================
    await queryRunner.query(`
      INSERT INTO "Students" (
        id, "studentId", school, grade,
        "totalCoursesEnrolled", "totalCoursesCompleted",
        "userId", "createdAt", "updatedAt"
      )
      VALUES
        (
          'f1000000-0000-4000-8000-000000000001',
          'STU-001',
          'Đại học Bách Khoa TP.HCM',
          'Năm 3',
          3, 0,
          '550e8400-e29b-41d4-a716-446655440001',
          NOW(), NOW()
        )
      ON CONFLICT ("userId") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "Students" WHERE id LIKE 'f1000000-0000-4000-8000-%'`,
    );
    await queryRunner.query(
      `DELETE FROM "Teachers" WHERE id LIKE 'f0000000-0000-4000-8000-%'`,
    );
  }
}
