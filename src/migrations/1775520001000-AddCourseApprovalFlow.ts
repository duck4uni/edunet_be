import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourseApprovalFlow1775520001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add rejectionReason column to Courses table
    await queryRunner.query(`
      ALTER TABLE "Courses"
      ADD COLUMN IF NOT EXISTS "rejectionReason" text NULL
    `);

    // Ensure all CourseStatus enum values exist (pending, approved, rejected were defined in entity)
    // These may or may not exist depending on DB state; use DO blocks to be safe
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "CourseStatus" ADD VALUE IF NOT EXISTS 'pending';
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "CourseStatus" ADD VALUE IF NOT EXISTS 'approved';
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "CourseStatus" ADD VALUE IF NOT EXISTS 'rejected';
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Courses" DROP COLUMN IF EXISTS "rejectionReason"
    `);
  }
}
