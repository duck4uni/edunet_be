import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTeacherApprovalFields1775520002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Teachers"
      ADD COLUMN IF NOT EXISTS "cvUrl" text NULL,
      ADD COLUMN IF NOT EXISTS "rejectionReason" text NULL
    `);

    // Ensure isActive defaults to false for new teacher registrations
    // (Users table already has isActive column defaulting to true — no change needed for schema,
    //  but we document here that teacher registrations set isActive=false explicitly)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "Teachers"
      DROP COLUMN IF EXISTS "cvUrl",
      DROP COLUMN IF EXISTS "rejectionReason"
    `);
  }
}
