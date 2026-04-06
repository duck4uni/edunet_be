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
import { User } from '../../user/entities/user.entity';

export enum ScheduleType {
  CLASS = 'class',
  EXAM = 'exam',
  ASSIGNMENT = 'assignment',
  EVENT = 'event',
}

export enum ScheduleStatus {
  SCHEDULED = 'scheduled',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
}

@Entity({ name: 'Schedules' })
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ScheduleType, default: ScheduleType.CLASS })
  type: ScheduleType;

  @Column({ type: 'varchar', length: 50, default: ScheduleStatus.SCHEDULED })
  status: ScheduleStatus;

  @Column({ type: 'text', nullable: true })
  cancelReason: string | null;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  meetingLink: string;

  @Column({ type: 'boolean', default: false })
  isOnline: boolean;

  @Column({ type: 'uuid', name: 'courseId', nullable: true })
  courseId: string;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column({ type: 'uuid', name: 'teacherId', nullable: true })
  teacherId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacherId' })
  teacher: User;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletedAt: Date | null;
}
