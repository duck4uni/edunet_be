import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration bổ sung các bảng và cột còn thiếu so với entities:
 * - Tạo bảng "Teachers" (teacher.entity.ts)
 * - Tạo bảng "Students" (student.entity.ts)
 * - Thêm cột "deletedAt" vào bảng "Sessions"
 * - Sửa cột "refreshToken" trong "Sessions" từ text → varchar(255) + UNIQUE
 * - Cho phép "slug" nullable trong "Categories"
 */
export class AddMissingTablesAndColumns1741335000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ==================== CREATE Teachers TABLE ====================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Teachers" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "teacherId" varchar(50) NOT NULL,
        "specialization" text,
        "qualification" varchar(255),
        "experience" integer DEFAULT 0 NOT NULL,
        "rating" numeric(2,1) DEFAULT 0 NOT NULL,
        "totalCourses" integer DEFAULT 0 NOT NULL,
        "totalStudents" integer DEFAULT 0 NOT NULL,
        "status" varchar(50) DEFAULT 'pending' NOT NULL,
        "bio" text,
        "socialLinks" jsonb,
        "earnings" numeric(12,2) DEFAULT 0 NOT NULL,
        "userId" uuid NOT NULL,
        "createdAt" timestamptz DEFAULT now() NOT NULL,
        "updatedAt" timestamptz DEFAULT now() NOT NULL,
        "deletedAt" timestamptz,
        CONSTRAINT "PK_Teachers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_Teachers_teacherId" UNIQUE ("teacherId"),
        CONSTRAINT "UQ_Teachers_userId" UNIQUE ("userId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_Teachers_userId" ON "Teachers" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_Teachers_status" ON "Teachers" ("status")`,
    );

    // ==================== CREATE Students TABLE ====================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Students" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "studentId" varchar(50) NOT NULL,
        "school" varchar(255),
        "grade" varchar(100),
        "totalCoursesEnrolled" integer DEFAULT 0 NOT NULL,
        "totalCoursesCompleted" integer DEFAULT 0 NOT NULL,
        "userId" uuid NOT NULL,
        "createdAt" timestamptz DEFAULT now() NOT NULL,
        "updatedAt" timestamptz DEFAULT now() NOT NULL,
        "deletedAt" timestamptz,
        CONSTRAINT "PK_Students" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_Students_studentId" UNIQUE ("studentId"),
        CONSTRAINT "UQ_Students_userId" UNIQUE ("userId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_Students_userId" ON "Students" ("userId")`,
    );

    // ==================== FIX Sessions TABLE ====================
    // Add missing deletedAt column
    await queryRunner.query(`
      ALTER TABLE "Sessions"
      ADD COLUMN IF NOT EXISTS "deletedAt" timestamptz
    `);

    // Fix refreshToken: text → varchar(255) + UNIQUE constraint
    await queryRunner.query(`
      ALTER TABLE "Sessions"
      ALTER COLUMN "refreshToken" TYPE varchar(255)
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "Sessions"
        ADD CONSTRAINT "UQ_Sessions_refreshToken" UNIQUE ("refreshToken");
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // ==================== FIX Categories.slug ====================
    // Entity defines slug as nullable: true
    await queryRunner.query(`
      ALTER TABLE "Categories"
      ALTER COLUMN "slug" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert Categories.slug back to NOT NULL
    await queryRunner.query(`
      UPDATE "Categories" SET "slug" = '' WHERE "slug" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "Categories"
      ALTER COLUMN "slug" SET NOT NULL
    `);

    // Revert Sessions.refreshToken
    await queryRunner.query(`
      ALTER TABLE "Sessions"
      DROP CONSTRAINT IF EXISTS "UQ_Sessions_refreshToken"
    `);
    await queryRunner.query(`
      ALTER TABLE "Sessions"
      ALTER COLUMN "refreshToken" TYPE text
    `);

    // Remove Sessions.deletedAt
    await queryRunner.query(`
      ALTER TABLE "Sessions"
      DROP COLUMN IF EXISTS "deletedAt"
    `);

    // Drop Students table
    await queryRunner.query(`DROP TABLE IF EXISTS "Students" CASCADE`);

    // Drop Teachers table
    await queryRunner.query(`DROP TABLE IF EXISTS "Teachers" CASCADE`);
  }
}
