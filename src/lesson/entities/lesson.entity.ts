import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Course } from '../../course/entities/course.entity';

export enum LessonType {
  VIDEO = 'video',
  READING = 'reading',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
}

@Entity({ name: 'Lessons' })
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: LessonType, default: LessonType.VIDEO })
  type: LessonType;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'text', nullable: true })
  videoUrl: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  duration: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'boolean', default: false })
  isFree: boolean;

  @Column({ type: 'boolean', default: true })
  isVisible: boolean;

  @Column({ type: 'uuid', name: 'courseId' })
  courseId: string;

  @ManyToOne(() => Course, (course) => course.lessons)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletedAt: Date | null;
}
