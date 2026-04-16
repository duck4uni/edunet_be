import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFriendshipsAndChatMessages1775520007000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create FriendshipStatus enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "friendship_status_enum" AS ENUM ('pending', 'accepted', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create Friendships table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "Friendships" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "requesterId" uuid NOT NULL,
        "receiverId" uuid NOT NULL,
        "status" "friendship_status_enum" NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_Friendships" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_Friendships_requester_receiver" UNIQUE ("requesterId", "receiverId"),
        CONSTRAINT "FK_Friendships_requester" FOREIGN KEY ("requesterId") REFERENCES "Users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_Friendships_receiver" FOREIGN KEY ("receiverId") REFERENCES "Users"("id") ON DELETE CASCADE
      )
    `);

    // Create ChatMessages table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ChatMessages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "senderId" uuid NOT NULL,
        "receiverId" uuid NOT NULL,
        "content" text NOT NULL,
        "type" character varying(20) NOT NULL DEFAULT 'text',
        "isRead" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ChatMessages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ChatMessages_sender" FOREIGN KEY ("senderId") REFERENCES "Users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ChatMessages_receiver" FOREIGN KEY ("receiverId") REFERENCES "Users"("id") ON DELETE CASCADE
      )
    `);

    // Indexes for performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_Friendships_requesterId" ON "Friendships" ("requesterId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_Friendships_receiverId" ON "Friendships" ("receiverId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ChatMessages_senderId_receiverId" ON "ChatMessages" ("senderId", "receiverId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ChatMessages_receiverId_isRead" ON "ChatMessages" ("receiverId", "isRead")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ChatMessages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Friendships"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "friendship_status_enum"`);
  }
}
