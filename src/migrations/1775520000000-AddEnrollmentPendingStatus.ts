import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnrollmentPendingStatus1775520000000 implements MigrationInterface {
  public transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "EnrollmentStatus" ADD VALUE 'pending';
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "EnrollmentStatus" ADD VALUE 'rejected';
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    // Change default status from 'active' to 'pending'
    await queryRunner.query(`
      ALTER TABLE "Enrollments" ALTER COLUMN "status" SET DEFAULT 'pending'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert default back to 'active'
    // Note: enum values cannot be removed in PostgreSQL without recreating the type
    await queryRunner.query(`
      ALTER TABLE "Enrollments" ALTER COLUMN "status" SET DEFAULT 'active'
    `);
  }
}
