import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum ChatDataFileType {
  TEXT = 'text',
  WORD = 'word',
}

@Entity({ name: 'ChatData' })
export class ChatData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: ChatDataFileType.TEXT,
  })
  fileType: ChatDataFileType | string;

  @Column({ type: 'text', nullable: true })
  htmlContent: string | null;

  @Column({ type: 'integer', default: 0 })
  imageCount: number;

  @Column({ type: 'varchar', nullable: true })
  date: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletedAt: Date | null;
}
