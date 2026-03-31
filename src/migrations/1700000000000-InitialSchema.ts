import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration khởi tạo toàn bộ schema: 14 tables, 14 enums, indexes
 * Tạo cấu trúc database ban đầu cho hệ thống EduNet
 */
export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ==================== ENUMS ====================
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "AssignmentStatus" AS ENUM ('pending', 'submitted', 'graded', 'overdue');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "AttemptStatus" AS ENUM ('in_progress', 'completed', 'timed_out');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "CourseLevel" AS ENUM ('beginner', 'intermediate', 'advanced', 'all');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "CourseStatus" AS ENUM ('draft', 'pending', 'approved', 'rejected', 'published', 'archived');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "EnrollmentStatus" AS ENUM ('active', 'completed', 'dropped', 'expired');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "LessonType" AS ENUM ('video', 'reading', 'quiz', 'assignment');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "MaterialType" AS ENUM ('pdf', 'video', 'document', 'link', 'image');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "QuizStatus" AS ENUM ('not_started', 'in_progress', 'completed');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "ScheduleType" AS ENUM ('class', 'exam', 'assignment', 'event');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "TicketCategory" AS ENUM ('technical', 'billing', 'course', 'account', 'other');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "TicketPriority" AS ENUM ('low', 'medium', 'high', 'urgent');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "TicketStatus" AS ENUM ('open', 'in_progress', 'resolved', 'closed');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "UserRole" AS ENUM ('student', 'teacher', 'admin');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // ==================== EXTENSION ====================
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ==================== TABLES ====================

    // Users
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Users" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "email" varchar(255) NOT NULL,
        "password" varchar(255) NOT NULL,
        "firstName" varchar(100),
        "lastName" varchar(100),
        "phone" varchar(20),
        "avatar" text,
        "gender" "Gender",
        "dateOfBirth" date,
        "address" text,
        "city" varchar(100),
        "country" varchar(100),
        "bio" text,
        "role" "UserRole" DEFAULT 'student' NOT NULL,
        "socialLinks" jsonb,
        "isActive" boolean DEFAULT true NOT NULL,
        "createdAt" timestamptz DEFAULT now() NOT NULL,
        "updatedAt" timestamptz DEFAULT now() NOT NULL,
        "deletedAt" timestamptz,
        "lastLogin" timestamptz,
        CONSTRAINT "PK_Users" PRIMARY KEY ("id")
      )
    `);

    // Categories
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Categories" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "image" text,
        "slug" varchar(255) NOT NULL,
        "isActive" boolean DEFAULT true NOT NULL,
        "createdAt" timestamptz DEFAULT now() NOT NULL,
        "updatedAt" timestamptz DEFAULT now() NOT NULL,
        "deletedAt" timestamptz,
        "order" integer DEFAULT 0 NOT NULL,
        CONSTRAINT "PK_Categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_Categories_slug" UNIQUE ("slug")
      )
    `);

    // Courses
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Courses" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "title" varchar(500) NOT NULL,
        "description" text,
        "thumbnail" text,
        "price" numeric DEFAULT 0 NOT NULL,
        "discountPrice" numeric,
        "duration" varchar(50),
        "totalLessons" integer DEFAULT 0 NOT NULL,
        "level" "CourseLevel" DEFAULT 'all' NOT NULL,
        "status" "CourseStatus" DEFAULT 'draft' NOT NULL,
        "language" varchar(50) DEFAULT 'Vietnamese',
        "schedule" text,
        "startDate" timestamptz,
        "categoryId" uuid,
        "teacherId" uuid,
        "createdAt" timestamptz DEFAULT now() NOT NULL,
        "updatedAt" timestamptz DEFAULT now() NOT NULL,
        "deletedAt" timestamptz,
        "totalStudents" integer DEFAULT 0 NOT NULL,
        "rating" numeric DEFAULT 0 NOT NULL,
        "totalReviews" integer DEFAULT 0 NOT NULL,
        "publishedAt" timestamptz,
        "goal" text,
        "tags" text,
        CONSTRAINT "PK_Courses" PRIMARY KEY ("id")
      )
    `);

    // Enrollments
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Enrollments" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "courseId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "status" "EnrollmentStatus" DEFAULT 'active' NOT NULL,
        "progress" integer DEFAULT 0 NOT NULL,
        "completedAt" timestamptz,
        "createdAt" timestamptz DEFAULT now() NOT NULL,
        "updatedAt" timestamptz DEFAULT now() NOT NULL,
        "deletedAt" timestamptz,
        "lastAccessedAt" timestamptz,
        CONSTRAINT "PK_Enrollments" PRIMARY KEY ("id")
      )
    `);

    // Lessons
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Lessons" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "title" varchar(500) NOT NULL,
        "description" text,
        "content" text,
        "type" "LessonType" DEFAULT 'video' NOT NULL,
        "duration" varchar(50),
        "order" integer DEFAULT 0 NOT NULL,
        "videoUrl" text,
        "isFree" boolean DEFAULT false NOT NULL,
        "courseId" uuid NOT NULL,
        "createdAt" timestamptz DEFAULT now() NOT NULL,
        "updatedAt" timestamptz DEFAULT now() NOT NULL,
        "deletedAt" timestamptz,
        CONSTRAINT "PK_Lessons" PRIMARY KEY ("id")
      )
    `);

    // Materials
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Materials" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "title" varchar(500) NOT NULL,
        "description" text,
        "type" "MaterialType" DEFAULT 'pdf' NOT NULL,
        "downloadUrl" text NOT NULL,
        "size" varchar(50),
        "courseId" uuid NOT NULL,
        "createdAt" timestamptz DEFAULT now() NOT NULL,
        "updatedAt" timestamptz DEFAULT now() NOT NULL,
        "deletedAt" timestamptz,
        CONSTRAINT "PK_Materials" PRIMARY KEY ("id")
      )
    `);

    // PasswordResets
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "PasswordResets" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "userId" uuid NOT NULL,
        "token" varchar(255) NOT NULL,
        "expiresAt" timestamptz NOT NULL,
        "isUsed" boolean DEFAULT false NOT NULL,
        "createdAt" timestamptz DEFAULT now() NOT NULL,
        "updatedAt" timestamptz DEFAULT now() NOT NULL,
        CONSTRAINT "PK_PasswordResets" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_PasswordResets_token" UNIQUE ("token")
      )
    `);

    // Quizzes
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Quizzes" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "title" varchar(500) NOT NULL,
        "description" text,
        "duration" integer DEFAULT 30 NOT NULL,
        "questions" jsonb,
        "totalQuestions" integer DEFAULT 0 NOT NULL,
        "maxAttempts" integer DEFAULT 1 NOT NULL,
        "passingScore" numeric DEFAULT 70 NOT NULL,
        "shuffleQuestions" boolean DEFAULT true NOT NULL,
        "showCorrectAnswers" boolean DEFAULT true NOT NULL,
        "courseId" uuid NOT NULL,
        "createdAt" timestamptz DEFAULT now() NOT NULL,
        "updatedAt" timestamptz DEFAULT now() NOT NULL,
        "deletedAt" timestamptz,
        CONSTRAINT "PK_Quizzes" PRIMARY KEY ("id")
      )
    `);

    // QuizAttempts
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "QuizAttempts" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "quizId" uuid NOT NULL,
        "studentId" uuid NOT NULL,
        "answers" jsonb,
        "score" numeric,
        "correctAnswers" integer DEFAULT 0 NOT NULL,
        "totalAnswered" integer DEFAULT 0 NOT NULL,
        "status" "AttemptStatus" DEFAULT 'in_progress' NOT NULL,
        "startedAt" timestamptz NOT NULL,
        "completedAt" timestamptz,
        "timeSpent" integer DEFAULT 0 NOT NULL,
        "createdAt" timestamptz DEFAULT now() NOT NULL,
        "updatedAt" timestamptz DEFAULT now() NOT NULL,
        CONSTRAINT "PK_QuizAttempts" PRIMARY KEY ("id")
      )
    `);

    // Reviews
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Reviews" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "rating" integer NOT NULL,
        "comment" text,
        "isVisible" boolean DEFAULT true NOT NULL,
        "courseId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "createdAt" timestamptz DEFAULT now() NOT NULL,
        "updatedAt" timestamptz DEFAULT now() NOT NULL,
        "deletedAt" timestamptz,
        CONSTRAINT "PK_Reviews" PRIMARY KEY ("id")
      )
    `);

    // Schedules
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Schedules" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "title" varchar(500) NOT NULL,
        "description" text,
        "type" "ScheduleType" DEFAULT 'class' NOT NULL,
        "date" date NOT NULL,
        "startTime" time NOT NULL,
        "endTime" time NOT NULL,
        "location" varchar(255),
        "meetingLink" varchar(500),
        "isOnline" boolean DEFAULT false NOT NULL,
        "courseId" uuid,
        "teacherId" uuid,
        "createdAt" timestamptz DEFAULT now() NOT NULL,
        "updatedAt" timestamptz DEFAULT now() NOT NULL,
        "deletedAt" timestamptz,
        CONSTRAINT "PK_Schedules" PRIMARY KEY ("id")
      )
    `);

    // Sessions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Sessions" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "userId" uuid NOT NULL,
        "refreshToken" text NOT NULL,
        "expiresAt" timestamptz NOT NULL,
        "userAgent" text,
        "ipAddress" varchar(50),
        "isRevoked" boolean DEFAULT false NOT NULL,
        "createdAt" timestamptz DEFAULT now() NOT NULL,
        "updatedAt" timestamptz DEFAULT now() NOT NULL,
        CONSTRAINT "PK_Sessions" PRIMARY KEY ("id")
      )
    `);

    // SupportTickets
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "SupportTickets" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "subject" varchar(500) NOT NULL,
        "message" text NOT NULL,
        "status" "TicketStatus" DEFAULT 'open' NOT NULL,
        "priority" "TicketPriority" DEFAULT 'medium' NOT NULL,
        "category" "TicketCategory" DEFAULT 'other' NOT NULL,
        "attachments" jsonb,
        "response" text,
        "respondedAt" timestamptz,
        "userId" uuid NOT NULL,
        "assignedToId" uuid,
        "createdAt" timestamptz DEFAULT now() NOT NULL,
        "updatedAt" timestamptz DEFAULT now() NOT NULL,
        "deletedAt" timestamptz,
        CONSTRAINT "PK_SupportTickets" PRIMARY KEY ("id")
      )
    `);

    // Assignments
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Assignments" (
        "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
        "title" varchar(500) NOT NULL,
        "description" text,
        "dueDate" timestamptz NOT NULL,
        "status" "AssignmentStatus" DEFAULT 'pending' NOT NULL,
        "grade" numeric,
        "maxGrade" numeric DEFAULT 100 NOT NULL,
        "attachments" jsonb,
        "feedback" text,
        "submissionUrl" text,
        "submittedAt" timestamptz,
        "courseId" uuid NOT NULL,
        "studentId" uuid,
        "createdAt" timestamptz DEFAULT now() NOT NULL,
        "updatedAt" timestamptz DEFAULT now() NOT NULL,
        "deletedAt" timestamptz,
        CONSTRAINT "PK_Assignments" PRIMARY KEY ("id")
      )
    `);

    // ==================== INDEXES ====================
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_Users_email" ON "Users" ("email")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_Users_email" ON "Users" ("email")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_Users_role" ON "Users" ("role")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_Courses_categoryId" ON "Courses" ("categoryId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_Courses_teacherId" ON "Courses" ("teacherId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_Courses_status" ON "Courses" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_Enrollments_courseId" ON "Enrollments" ("courseId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_Enrollments_userId" ON "Enrollments" ("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_Lessons_courseId" ON "Lessons" ("courseId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_Materials_courseId" ON "Materials" ("courseId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_Quizzes_courseId" ON "Quizzes" ("courseId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_Reviews_courseId" ON "Reviews" ("courseId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_Schedules_date" ON "Schedules" ("date")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_Sessions_userId" ON "Sessions" ("userId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_SupportTickets_status" ON "SupportTickets" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_Assignments_courseId" ON "Assignments" ("courseId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables (reverse order to avoid dependency issues)
    await queryRunner.query(`DROP TABLE IF EXISTS "Assignments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "SupportTickets" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Sessions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Schedules" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Reviews" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "QuizAttempts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Quizzes" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "PasswordResets" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Materials" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Lessons" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Enrollments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Courses" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Users" CASCADE`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "AssignmentStatus"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "AttemptStatus"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "CourseLevel"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "CourseStatus"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "EnrollmentStatus"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "Gender"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "LessonType"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "MaterialType"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "QuizStatus"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ScheduleType"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "TicketCategory"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "TicketPriority"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "TicketStatus"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "UserRole"`);
  }
}
