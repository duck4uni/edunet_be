import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class SeedRequestedUsers1775520004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hashedPassword = await bcrypt.hash('12345678', 10);

    await queryRunner.query(
      `
      INSERT INTO "Users" (
        id, email, password, "firstName", "lastName", phone, role, "isActive", "createdAt", "updatedAt"
      )
      VALUES
        (
          '550e8400-e29b-41d4-a716-446655440010',
          'lebaohongduc713@gmail.com',
          $1,
          'Duc',
          'Admin',
          '0905000010',
          'admin',
          true,
          NOW(),
          NOW()
        ),
        (
          '550e8400-e29b-41d4-a716-446655440011',
          'lebaohongduc6969@gmail.com',
          $1,
          'Duc',
          'Student',
          '0905000011',
          'student',
          true,
          NOW(),
          NOW()
        ),
        (
          '550e8400-e29b-41d4-a716-446655440012',
          '1721031293@dntu.edu.vn',
          $1,
          'Duc',
          'Teacher',
          '0905000012',
          'teacher',
          true,
          NOW(),
          NOW()
        )
      ON CONFLICT (email) DO NOTHING
      `,
      [hashedPassword],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "Users"
      WHERE email IN (
        'lebaohongduc713@gmail.com',
        'lebaohongduc6969@gmail.com',
        '1721031293@dntu.edu.vn'
      )
    `);
  }
}
