import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateChatDataTable1775520004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'ChatData',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'fileType',
            type: 'varchar',
            length: '50',
            default: "'text'",
            isNullable: false,
            comment: "Loại file: 'text' hoặc 'word'",
          },
          {
            name: 'htmlContent',
            type: 'text',
            isNullable: true,
            comment: 'Nội dung HTML (nếu có)',
          },
          {
            name: 'imageCount',
            type: 'integer',
            default: 0,
            isNullable: false,
            comment: 'Số lượng hình ảnh đính kèm',
          },
          {
            name: 'date',
            type: 'varchar',
            isNullable: true,
            comment: 'Mô tả thời điểm hiển thị',
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'deletedAt',
            type: 'timestamp with time zone',
            isNullable: true,
            comment: 'Soft delete timestamp',
          },
        ],
        indices: [
          {
            name: 'IDX_ChatData_title',
            columnNames: ['title'],
          },
          {
            name: 'IDX_ChatData_createdAt',
            columnNames: ['createdAt'],
          },
          {
            name: 'IDX_ChatData_deletedAt',
            columnNames: ['deletedAt'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ChatData');
  }
}
