import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsVisibleToLearningEntities1775520006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add isVisible column to Lessons
    await queryRunner.query(`
      ALTER TABLE "Lessons"
      ADD COLUMN IF NOT EXISTS "isVisible" boolean NOT NULL DEFAULT true
    `);

    // Add isVisible column to Materials
    await queryRunner.query(`
      ALTER TABLE "Materials"
      ADD COLUMN IF NOT EXISTS "isVisible" boolean NOT NULL DEFAULT true
    `);

    // Add isVisible column to Assignments
    await queryRunner.query(`
      ALTER TABLE "Assignments"
      ADD COLUMN IF NOT EXISTS "isVisible" boolean NOT NULL DEFAULT true
    `);

    // Add isVisible column to Quizzes
    await queryRunner.query(`
      ALTER TABLE "Quizzes"
      ADD COLUMN IF NOT EXISTS "isVisible" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Quizzes" DROP COLUMN IF EXISTS "isVisible"`);
    await queryRunner.query(`ALTER TABLE "Assignments" DROP COLUMN IF EXISTS "isVisible"`);
    await queryRunner.query(`ALTER TABLE "Materials" DROP COLUMN IF EXISTS "isVisible"`);
    await queryRunner.query(`ALTER TABLE "Lessons" DROP COLUMN IF EXISTS "isVisible"`);
  }
}
