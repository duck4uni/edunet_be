import { MigrationInterface, QueryRunner, Table, TableUnique } from 'typeorm';

export class CreateChatSettingsTable1775520008000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'ChatSettings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'userId', type: 'uuid' },
          { name: 'partnerId', type: 'uuid' },
          { name: 'isPinned', type: 'boolean', default: false },
          { name: 'isHidden', type: 'boolean', default: false },
          { name: 'hiddenAt', type: 'timestamp with time zone', isNullable: true },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp with time zone',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'Users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['partnerId'],
            referencedTableName: 'Users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createUniqueConstraint(
      'ChatSettings',
      new TableUnique({
        name: 'UQ_chat_settings_user_partner',
        columnNames: ['userId', 'partnerId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ChatSettings');
  }
}
