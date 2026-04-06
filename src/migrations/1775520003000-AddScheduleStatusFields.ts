import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddScheduleStatusFields1775520003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add status column (varchar so no enum type need be managed)
    await queryRunner.query(`
      ALTER TABLE "Schedules"
      ADD COLUMN IF NOT EXISTS "status" varchar(50) NOT NULL DEFAULT 'scheduled'
    `);

    // Add cancelReason column for cancellation / postpone notes
    await queryRunner.query(`
      ALTER TABLE "Schedules"
      ADD COLUMN IF NOT EXISTS "cancelReason" text NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Schedules" DROP COLUMN IF EXISTS "cancelReason"`);
    await queryRunner.query(`ALTER TABLE "Schedules" DROP COLUMN IF EXISTS "status"`);
  }
}
