import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Schedule, ScheduleStatus } from './entities/schedule.entity';
import { Enrollment, EnrollmentStatus } from 'src/enrollment/entities/enrollment.entity';
import { User, UserRole } from 'src/user/entities/user.entity';
import { Pagination } from 'src/core/decorators/pagination-params.decorator';
import { Sorting } from 'src/core/decorators/sorting-params.decorator';
import { Filtering } from 'src/core/decorators/filtering-params.decorator';
import { Including } from 'src/core/decorators/including-params.decorator';
import { getOrder, getWhere, getRelations } from 'src/core/helpers';
import { ErrorResponse, SuccessResponse } from 'src/core/responses/base.responses';
import { CommonResponse, PaginationResponseInterface } from 'src/core/types/response';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CancelScheduleDto } from './dto/cancel-schedule.dto';
import { PostponeScheduleDto } from './dto/postpone-schedule.dto';
import { CreateRecurringScheduleDto } from './dto/create-recurring-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  // ─── Private helper: conflict detection ───────────────────────────────────

  private async detectConflict(
    date: string,
    startTime: string,
    endTime: string,
    teacherId?: string,
    courseId?: string,
    excludeId?: string,
  ): Promise<Schedule | null> {
    const base = this.scheduleRepository
      .createQueryBuilder('s')
      .where('s.date = :date', { date })
      .andWhere('s.startTime < :endTime', { endTime })
      .andWhere('s.endTime > :startTime', { startTime })
      .andWhere('s.status != :cancelled', { cancelled: ScheduleStatus.CANCELLED })
      .andWhere('s.deletedAt IS NULL');

    if (excludeId) {
      base.andWhere('s.id != :excludeId', { excludeId });
    }

    if (teacherId) {
      const conflict = await base
        .clone()
        .andWhere('s.teacherId = :teacherId', { teacherId })
        .getOne();
      if (conflict) return conflict;
    }

    if (courseId) {
      const conflict = await base
        .clone()
        .andWhere('s.courseId = :courseId', { courseId })
        .getOne();
      if (conflict) return conflict;
    }

    return null;
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async create(createScheduleDto: CreateScheduleDto, currentUser: User): Promise<CommonResponse<Schedule>> {
    const teacherId =
      currentUser.role === UserRole.TEACHER ? currentUser.id : createScheduleDto.teacherId;

    const conflict = await this.detectConflict(
      createScheduleDto.date,
      createScheduleDto.startTime,
      createScheduleDto.endTime,
      teacherId,
      createScheduleDto.courseId,
    );

    if (conflict) {
      return new ErrorResponse(
        `Schedule conflict: "${conflict.title}" already occupies this time slot`,
        HttpStatus.CONFLICT,
      );
    }

    const schedule = this.scheduleRepository.create({
      ...createScheduleDto,
      teacherId,
      status: ScheduleStatus.SCHEDULED,
    });

    const saved = await this.scheduleRepository.save(schedule);
    return new SuccessResponse(saved, HttpStatus.CREATED);
  }

  async findAll(
    pagination: Pagination,
    sorts: Sorting[] | null,
    filters: Filtering[] | null,
    includes: Including | null,
  ): Promise<CommonResponse<PaginationResponseInterface<Schedule>>> {
    const where = filters ? getWhere(filters) : {};
    const order = sorts ? getOrder(sorts) : { date: 'ASC', startTime: 'ASC' };
    const relations = includes ? getRelations(includes) : [];

    const [rows, count] = await this.scheduleRepository.findAndCount({
      where,
      order,
      relations,
      skip: pagination.offset,
      take: pagination.limit,
    });

    return new SuccessResponse({ rows, count });
  }

  async findOne(id: string): Promise<CommonResponse<Schedule>> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['course', 'teacher'],
    });

    if (!schedule) {
      return new ErrorResponse('Schedule not found', HttpStatus.NOT_FOUND);
    }

    return new SuccessResponse(schedule);
  }

  async update(
    id: string,
    updateScheduleDto: UpdateScheduleDto,
    currentUser: User,
  ): Promise<CommonResponse<Schedule>> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });

    if (!schedule) {
      return new ErrorResponse('Schedule not found', HttpStatus.NOT_FOUND);
    }

    // Teachers can only update their own schedules
    if (currentUser.role === UserRole.TEACHER && schedule.teacherId !== currentUser.id) {
      return new ErrorResponse('Forbidden: you do not own this schedule', HttpStatus.FORBIDDEN);
    }

    if (schedule.status === ScheduleStatus.CANCELLED) {
      return new ErrorResponse('Cannot update a cancelled schedule', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const newDate = updateScheduleDto.date ?? String(schedule.date);
    const newStart = updateScheduleDto.startTime ?? schedule.startTime;
    const newEnd = updateScheduleDto.endTime ?? schedule.endTime;
    const newTeacherId = updateScheduleDto.teacherId ?? schedule.teacherId;
    const newCourseId = updateScheduleDto.courseId ?? schedule.courseId;

    const conflict = await this.detectConflict(newDate, newStart, newEnd, newTeacherId, newCourseId, id);
    if (conflict) {
      return new ErrorResponse(
        `Schedule conflict: "${conflict.title}" already occupies this time slot`,
        HttpStatus.CONFLICT,
      );
    }

    Object.assign(schedule, updateScheduleDto);
    const updated = await this.scheduleRepository.save(schedule);
    return new SuccessResponse(updated);
  }

  async remove(id: string): Promise<CommonResponse> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });

    if (!schedule) {
      return new ErrorResponse('Schedule not found', HttpStatus.NOT_FOUND);
    }

    await this.scheduleRepository.softDelete(id);
    return new SuccessResponse({ message: 'Schedule deleted successfully' });
  }

  // ─── Status management ─────────────────────────────────────────────────────

  async cancel(id: string, dto: CancelScheduleDto, currentUser: User): Promise<CommonResponse<Schedule>> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });

    if (!schedule) {
      return new ErrorResponse('Schedule not found', HttpStatus.NOT_FOUND);
    }

    if (currentUser.role === UserRole.TEACHER && schedule.teacherId !== currentUser.id) {
      return new ErrorResponse('Forbidden: you do not own this schedule', HttpStatus.FORBIDDEN);
    }

    if (schedule.status === ScheduleStatus.CANCELLED) {
      return new ErrorResponse('Schedule is already cancelled', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    schedule.status = ScheduleStatus.CANCELLED;
    schedule.cancelReason = dto.cancelReason ?? null;
    const saved = await this.scheduleRepository.save(schedule);
    return new SuccessResponse(saved);
  }

  async postpone(id: string, dto: PostponeScheduleDto, currentUser: User): Promise<CommonResponse<Schedule>> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });

    if (!schedule) {
      return new ErrorResponse('Schedule not found', HttpStatus.NOT_FOUND);
    }

    if (currentUser.role === UserRole.TEACHER && schedule.teacherId !== currentUser.id) {
      return new ErrorResponse('Forbidden: you do not own this schedule', HttpStatus.FORBIDDEN);
    }

    if (schedule.status === ScheduleStatus.CANCELLED) {
      return new ErrorResponse('Cannot postpone a cancelled schedule', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const conflict = await this.detectConflict(
      dto.newDate,
      dto.newStartTime,
      dto.newEndTime,
      schedule.teacherId,
      schedule.courseId,
      id,
    );

    if (conflict) {
      return new ErrorResponse(
        `Schedule conflict on new date: "${conflict.title}" already occupies this time slot`,
        HttpStatus.CONFLICT,
      );
    }

    schedule.date = new Date(dto.newDate);
    schedule.startTime = dto.newStartTime;
    schedule.endTime = dto.newEndTime;
    schedule.status = ScheduleStatus.POSTPONED;
    schedule.cancelReason = dto.notes ?? null;
    const saved = await this.scheduleRepository.save(schedule);
    return new SuccessResponse(saved);
  }

  // ─── Recurring sessions ───────────────────────────────────────────────────

  async createRecurring(
    dto: CreateRecurringScheduleDto,
    currentUser: User,
  ): Promise<CommonResponse<{ count: number; sessions: Schedule[] }>> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.recurrenceEndDate);

    if (endDate < startDate) {
      return new ErrorResponse('recurrenceEndDate must be after startDate', HttpStatus.BAD_REQUEST);
    }

    const teacherId = currentUser.role === UserRole.TEACHER ? currentUser.id : dto.teacherId;

    const toCreate: Partial<Schedule>[] = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    while (current <= endDate) {
      if (dto.weekDays.includes(current.getDay())) {
        const dateStr = current.toISOString().split('T')[0];
        const conflict = await this.detectConflict(dateStr, dto.startTime, dto.endTime, teacherId, dto.courseId);

        if (!conflict) {
          toCreate.push({
            title: dto.title,
            description: dto.description,
            type: dto.type,
            date: new Date(current),
            startTime: dto.startTime,
            endTime: dto.endTime,
            location: dto.location,
            meetingLink: dto.meetingLink,
            isOnline: dto.isOnline ?? false,
            courseId: dto.courseId,
            teacherId,
            status: ScheduleStatus.SCHEDULED,
            cancelReason: null,
          });
        }
      }
      current.setDate(current.getDate() + 1);
    }

    if (toCreate.length === 0) {
      return new ErrorResponse(
        'No sessions could be created — all slots have conflicts or no weekdays match',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const saved = await this.scheduleRepository.save(toCreate.map((s) => this.scheduleRepository.create(s)));
    return new SuccessResponse({ count: saved.length, sessions: saved }, HttpStatus.CREATED);
  }

  // ─── Filtered / special views ─────────────────────────────────────────────

  async findByCourse(courseId: string): Promise<CommonResponse<Schedule[]>> {
    const schedules = await this.scheduleRepository.find({
      where: { courseId },
      relations: ['teacher'],
      order: { date: 'ASC', startTime: 'ASC' },
    });

    return new SuccessResponse(schedules);
  }

  async findByTeacher(teacherId: string): Promise<CommonResponse<Schedule[]>> {
    const schedules = await this.scheduleRepository.find({
      where: { teacherId },
      relations: ['course'],
      order: { date: 'ASC', startTime: 'ASC' },
    });

    return new SuccessResponse(schedules);
  }

  async findUpcoming(days: number = 7): Promise<CommonResponse<Schedule[]>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);

    const schedules = await this.scheduleRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.course', 'course')
      .leftJoinAndSelect('s.teacher', 'teacher')
      .where('s.date >= :today', { today: today.toISOString().split('T')[0] })
      .andWhere('s.date <= :futureDate', { futureDate: futureDate.toISOString().split('T')[0] })
      .andWhere('s.status != :cancelled', { cancelled: ScheduleStatus.CANCELLED })
      .andWhere('s.deletedAt IS NULL')
      .orderBy('s.date', 'ASC')
      .addOrderBy('s.startTime', 'ASC')
      .getMany();

    return new SuccessResponse(schedules);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<CommonResponse<Schedule[]>> {
    const schedules = await this.scheduleRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.course', 'course')
      .leftJoinAndSelect('s.teacher', 'teacher')
      .where('s.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('s.deletedAt IS NULL')
      .orderBy('s.date', 'ASC')
      .addOrderBy('s.startTime', 'ASC')
      .getMany();

    return new SuccessResponse(schedules);
  }

  /**
   * Weekly view — returns all schedules for the 7 days starting at weekStart,
   * grouped by date for easy calendar rendering.
   */
  async findWeekly(
    weekStart: string,
    courseId?: string,
    teacherId?: string,
  ): Promise<CommonResponse<{ weekStart: string; weekEnd: string; byDay: Record<string, Schedule[]> }>> {
    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const qb = this.scheduleRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.course', 'course')
      .leftJoinAndSelect('s.teacher', 'teacher')
      .where('s.date BETWEEN :startStr AND :endStr', { startStr, endStr })
      .andWhere('s.deletedAt IS NULL')
      .orderBy('s.date', 'ASC')
      .addOrderBy('s.startTime', 'ASC');

    if (courseId) qb.andWhere('s.courseId = :courseId', { courseId });
    if (teacherId) qb.andWhere('s.teacherId = :teacherId', { teacherId });

    const schedules = await qb.getMany();

    // Group by ISO date string
    const byDay: Record<string, Schedule[]> = {};
    const cursor = new Date(start);
    for (let i = 0; i < 7; i++) {
      byDay[cursor.toISOString().split('T')[0]] = [];
      cursor.setDate(cursor.getDate() + 1);
    }

    for (const s of schedules) {
      const key = new Date(s.date).toISOString().split('T')[0];
      if (byDay[key]) byDay[key].push(s);
      else byDay[key] = [s];
    }

    return new SuccessResponse({ weekStart: startStr, weekEnd: endStr, byDay });
  }

  /**
   * Personalized timetable.
   * - Teacher: own teaching schedules from today onwards.
   * - Student: schedules of actively enrolled courses from today onwards.
   */
  async findMyTimetable(currentUser: User): Promise<CommonResponse<Schedule[]>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (currentUser.role === UserRole.TEACHER) {
      const teacherSchedules = await this.scheduleRepository
        .createQueryBuilder('s')
        .leftJoinAndSelect('s.course', 'course')
        .leftJoinAndSelect('s.teacher', 'teacher')
        .where('s.teacherId = :teacherId', { teacherId: currentUser.id })
        .andWhere('s.date >= :today', { today: today.toISOString().split('T')[0] })
        .andWhere('s.status != :cancelled', { cancelled: ScheduleStatus.CANCELLED })
        .andWhere('s.deletedAt IS NULL')
        .orderBy('s.date', 'ASC')
        .addOrderBy('s.startTime', 'ASC')
        .getMany();

      return new SuccessResponse(teacherSchedules);
    }

    const enrollments = await this.enrollmentRepository.find({
      where: { userId: currentUser.id, status: EnrollmentStatus.ACTIVE },
    });

    if (enrollments.length === 0) {
      return new SuccessResponse([]);
    }

    const courseIds = enrollments.map((e) => e.courseId);

    const schedules = await this.scheduleRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.course', 'course')
      .leftJoinAndSelect('s.teacher', 'teacher')
      .where('s.courseId IN (:...courseIds)', { courseIds })
      .andWhere('s.date >= :today', { today: today.toISOString().split('T')[0] })
      .andWhere('s.status != :cancelled', { cancelled: ScheduleStatus.CANCELLED })
      .andWhere('s.deletedAt IS NULL')
      .orderBy('s.date', 'ASC')
      .addOrderBy('s.startTime', 'ASC')
      .getMany();

    return new SuccessResponse(schedules);
  }
}
