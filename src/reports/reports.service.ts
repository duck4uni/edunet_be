import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs, { Dayjs } from 'dayjs';
import { Repository } from 'typeorm';
import { Category } from 'src/category/entities/category.entity';
import { Course, CourseStatus } from 'src/course/entities/course.entity';
import { Enrollment, EnrollmentStatus } from 'src/enrollment/entities/enrollment.entity';
import { ErrorResponse, SuccessResponse } from 'src/core/responses/base.responses';
import { CommonResponse } from 'src/core/types/response';
import { SupportTicket, TicketStatus } from 'src/support-ticket/entities/support-ticket.entity';
import { User, UserRole } from 'src/user/entities/user.entity';
import { ExportReportQueryDto, ReportGroupBy, ReportQueryDto } from './dto/report-query.dto';

type RangeWindow = {
  start: Date;
  end: Date;
  startLabel: string;
  endLabel: string;
  days: number;
};

type WarningMessage = {
  code: 'LARGE_RANGE';
  message: string;
  suggestion: string;
};

type AvailabilityState = {
  hasData: boolean;
  reason?: string;
};

type OverviewMetrics = {
  totalUsers: number;
  totalTeachers: number;
  totalCourses: number;
  newUsers: number;
  newCourses: number;
  publishedCourses: number;
  enrollments: number;
  tickets: number;
  openTickets: number;
  pendingCourses: number;
  grossRevenue: number;
  revenueEnrollments: number;
};

type ReportPayload = {
  generatedAt: string;
  range: {
    startDate: string;
    endDate: string;
    days: number;
    groupBy: Exclude<ReportGroupBy, ReportGroupBy.AUTO>;
  };
  filters: {
    userRole?: UserRole;
    courseStatus?: CourseStatus;
    enrollmentStatus?: EnrollmentStatus;
    ticketStatus?: TicketStatus;
    categoryId?: string;
  };
  warnings: WarningMessage[];
  availability: {
    users: AvailabilityState;
    courses: AvailabilityState;
    enrollments: AvailabilityState;
    tickets: AvailabilityState;
    revenue: AvailabilityState;
  };
  overview: OverviewMetrics;
  breakdowns: {
    usersByRole: Array<{ role: string; count: number }>;
    coursesByStatus: Array<{ status: string; count: number }>;
    enrollmentsByStatus: Array<{ status: string; count: number }>;
    ticketsByStatus: Array<{ status: string; count: number }>;
    revenueByCategory: Array<{ categoryId: string | null; categoryName: string; revenue: number; enrollments: number }>;
  };
  trends: {
    labels: string[];
    users: number[];
    courses: number[];
    enrollments: number[];
    tickets: number[];
    revenue: number[];
  };
  comparison: null | {
    range: {
      startDate: string;
      endDate: string;
      days: number;
    };
    overview: OverviewMetrics;
    delta: {
      newUsersPct: number;
      newCoursesPct: number;
      enrollmentsPct: number;
      ticketsPct: number;
      revenuePct: number;
      totalTeachersPct: number;
    };
  };
  widgets: {
    topCourses: Array<{
      id: string;
      title: string;
      thumbnail: string | null;
      totalStudents: number;
      rating: number;
      teacher: {
        id: string;
        name: string;
      };
    }>;
    topTeachers: Array<{
      id: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
      totalCourses: number;
      totalStudents: number;
      rating: number;
    }>;
    recentTickets: Array<{
      id: string;
      ticketId: string;
      userName: string;
      subject: string;
      status: string;
      createdAt: string;
    }>;
    coursesChart: {
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
      }>;
    };
  };
  legacyStats: {
    totalUsers: number;
    totalTeachers: number;
    totalCourses: number;
    totalRevenue: number;
    newUsersToday: number;
    newCoursesToday: number;
    pendingApprovals: number;
    openTickets: number;
    usersGrowth: number;
    revenueGrowth: number;
    coursesGrowth: number;
    teachersGrowth: number;
  };
};

@Injectable()
export class ReportsService {
  private readonly largeRangeThresholdDays = 365;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(SupportTicket)
    private readonly ticketRepository: Repository<SupportTicket>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async getDashboard(query: ReportQueryDto): Promise<CommonResponse<ReportPayload>> {
    const payload = await this.buildReportPayload(query);
    return new SuccessResponse(payload);
  }

  async exportReport(query: ExportReportQueryDto): Promise<CommonResponse<{
    format: 'csv' | 'json';
    fileName: string;
    mimeType: string;
    content: string | ReportPayload;
  }>> {
    const payload = await this.buildReportPayload(query);
    const nowKey = dayjs().format('YYYYMMDD-HHmmss');

    if (query.format === 'json') {
      return new SuccessResponse({
        format: 'json',
        fileName: `edunet-report-${nowKey}.json`,
        mimeType: 'application/json',
        content: payload,
      });
    }

    return new SuccessResponse({
      format: 'csv',
      fileName: `edunet-report-${nowKey}.csv`,
      mimeType: 'text/csv;charset=utf-8',
      content: this.toCsv(payload),
    });
  }

  private async buildReportPayload(query: ReportQueryDto): Promise<ReportPayload> {
    const currentRange = this.resolveRange(query.startDate, query.endDate);
    const compareRange = this.resolveCompareRange(query, currentRange);

    const warnings: WarningMessage[] = [];
    if (currentRange.days > this.largeRangeThresholdDays) {
      warnings.push({
        code: 'LARGE_RANGE',
        message: `Khoảng thời gian đang chọn (${currentRange.days} ngày) có thể gây tải nặng cho hệ thống.`,
        suggestion: 'Nên chia nhỏ thành từng giai đoạn 30-90 ngày để xem nhanh và ổn định hơn.',
      });
    }

    const groupBy = this.resolveGroupBy(query.groupBy, currentRange.days);

    const [
      overview,
      usersByRole,
      coursesByStatus,
      enrollmentsByStatus,
      ticketsByStatus,
      revenueByCategory,
      trends,
      topCourses,
      topTeachers,
      recentTickets,
      categoryDistribution,
      todayStats,
    ] = await Promise.all([
      this.getOverviewMetrics(currentRange, query),
      this.getUsersByRole(query),
      this.getCoursesByStatus(query),
      this.getEnrollmentsByStatus(query),
      this.getTicketsByStatus(query),
      this.getRevenueByCategory(currentRange, query),
      this.getTrendSeries(currentRange, groupBy, query),
      this.getTopCourses(currentRange, query),
      this.getTopTeachers(currentRange, query),
      this.getRecentTickets(currentRange, query),
      this.getCourseCategoryDistribution(query),
      this.getTodayStats(query),
    ]);

    const comparisonOverview = compareRange
      ? await this.getOverviewMetrics(compareRange, query)
      : null;

    const comparison = comparisonOverview
      ? {
          range: {
            startDate: compareRange.startLabel,
            endDate: compareRange.endLabel,
            days: compareRange.days,
          },
          overview: comparisonOverview,
          delta: {
            newUsersPct: this.calcGrowthPct(overview.newUsers, comparisonOverview.newUsers),
            newCoursesPct: this.calcGrowthPct(overview.newCourses, comparisonOverview.newCourses),
            enrollmentsPct: this.calcGrowthPct(overview.enrollments, comparisonOverview.enrollments),
            ticketsPct: this.calcGrowthPct(overview.tickets, comparisonOverview.tickets),
            revenuePct: this.calcGrowthPct(overview.grossRevenue, comparisonOverview.grossRevenue),
            totalTeachersPct: this.calcGrowthPct(overview.totalTeachers, comparisonOverview.totalTeachers),
          },
        }
      : null;

    const availability = {
      users: this.toAvailability(overview.newUsers, 'Không có dữ liệu người dùng trong khoảng thời gian đã chọn.'),
      courses: this.toAvailability(overview.newCourses, 'Không có dữ liệu khóa học trong khoảng thời gian đã chọn.'),
      enrollments: this.toAvailability(
        overview.enrollments,
        'Không có dữ liệu ghi danh trong khoảng thời gian đã chọn.',
      ),
      tickets: this.toAvailability(overview.tickets, 'Không có dữ liệu hỗ trợ trong khoảng thời gian đã chọn.'),
      revenue: this.toAvailability(
        overview.revenueEnrollments,
        'Không đủ dữ liệu giao dịch hợp lệ để tính doanh thu.',
      ),
    };

    const legacyStats = {
      totalUsers: overview.totalUsers,
      totalTeachers: overview.totalTeachers,
      totalCourses: overview.totalCourses,
      totalRevenue: overview.grossRevenue,
      newUsersToday: todayStats.newUsersToday,
      newCoursesToday: todayStats.newCoursesToday,
      pendingApprovals: overview.pendingCourses,
      openTickets: overview.openTickets,
      usersGrowth: comparison?.delta.newUsersPct ?? 0,
      revenueGrowth: comparison?.delta.revenuePct ?? 0,
      coursesGrowth: comparison?.delta.newCoursesPct ?? 0,
      teachersGrowth: comparison?.delta.totalTeachersPct ?? 0,
    };

    return {
      generatedAt: new Date().toISOString(),
      range: {
        startDate: currentRange.startLabel,
        endDate: currentRange.endLabel,
        days: currentRange.days,
        groupBy,
      },
      filters: {
        userRole: query.userRole,
        courseStatus: query.courseStatus,
        enrollmentStatus: query.enrollmentStatus,
        ticketStatus: query.ticketStatus,
        categoryId: query.categoryId,
      },
      warnings,
      availability,
      overview,
      breakdowns: {
        usersByRole,
        coursesByStatus,
        enrollmentsByStatus,
        ticketsByStatus,
        revenueByCategory,
      },
      trends,
      comparison,
      widgets: {
        topCourses,
        topTeachers,
        recentTickets,
        coursesChart: {
          labels: categoryDistribution.map((item) => item.categoryName),
          datasets: [
            {
              label: 'Số lượng khóa học',
              data: categoryDistribution.map((item) => item.count),
            },
          ],
        },
      },
      legacyStats,
    };
  }

  private resolveRange(startDate?: string, endDate?: string): RangeWindow {
    const end = endDate ? dayjs(endDate) : dayjs();
    if (!end.isValid()) {
      throw new ErrorResponse('endDate không hợp lệ', HttpStatus.BAD_REQUEST);
    }

    const start = startDate ? dayjs(startDate) : end.subtract(29, 'day');
    if (!start.isValid()) {
      throw new ErrorResponse('startDate không hợp lệ', HttpStatus.BAD_REQUEST);
    }

    const normalizedStart = start.startOf('day');
    const normalizedEnd = end.endOf('day');

    if (normalizedStart.isAfter(normalizedEnd)) {
      throw new ErrorResponse('startDate phải nhỏ hơn hoặc bằng endDate', HttpStatus.BAD_REQUEST);
    }

    return {
      start: normalizedStart.toDate(),
      end: normalizedEnd.toDate(),
      startLabel: normalizedStart.format('YYYY-MM-DD'),
      endLabel: normalizedEnd.format('YYYY-MM-DD'),
      days: normalizedEnd.diff(normalizedStart, 'day') + 1,
    };
  }

  private resolveCompareRange(
    query: ReportQueryDto,
    currentRange: RangeWindow,
  ): RangeWindow | null {
    const hasCompareStart = !!query.compareStartDate;
    const hasCompareEnd = !!query.compareEndDate;

    if (hasCompareStart !== hasCompareEnd) {
      throw new ErrorResponse(
        'Cần cung cấp đầy đủ compareStartDate và compareEndDate',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (hasCompareStart && hasCompareEnd) {
      return this.resolveRange(query.compareStartDate, query.compareEndDate);
    }

    const compareEnd = dayjs(currentRange.start).subtract(1, 'day').endOf('day');
    const compareStart = compareEnd.subtract(currentRange.days - 1, 'day').startOf('day');

    return {
      start: compareStart.toDate(),
      end: compareEnd.toDate(),
      startLabel: compareStart.format('YYYY-MM-DD'),
      endLabel: compareEnd.format('YYYY-MM-DD'),
      days: currentRange.days,
    };
  }

  private resolveGroupBy(
    requested: ReportGroupBy | undefined,
    days: number,
  ): Exclude<ReportGroupBy, ReportGroupBy.AUTO> {
    if (requested && requested !== ReportGroupBy.AUTO) {
      return requested;
    }

    if (days <= 62) {
      return ReportGroupBy.DAY;
    }
    if (days <= 370) {
      return ReportGroupBy.WEEK;
    }
    return ReportGroupBy.MONTH;
  }

  private toAvailability(count: number, reason: string): AvailabilityState {
    if (count > 0) {
      return { hasData: true };
    }
    return { hasData: false, reason };
  }

  private calcGrowthPct(currentValue: number, previousValue: number): number {
    if (previousValue === 0) {
      return currentValue > 0 ? 100 : 0;
    }
    return Number((((currentValue - previousValue) / previousValue) * 100).toFixed(2));
  }

  private resolveRevenueStatuses(enrollmentStatus?: EnrollmentStatus): EnrollmentStatus[] {
    if (enrollmentStatus) {
      return [enrollmentStatus];
    }

    return [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED];
  }

  private applyCourseFilters(
    qb: ReturnType<Repository<Course>['createQueryBuilder']>,
    query: ReportQueryDto,
  ): void {
    if (query.courseStatus) {
      qb.andWhere('c.status = :courseStatus', { courseStatus: query.courseStatus });
    }

    if (query.categoryId) {
      qb.andWhere('c."categoryId" = :categoryId', { categoryId: query.categoryId });
    }
  }

  private applyUserRoleFilter(
    qb: ReturnType<Repository<Enrollment>['createQueryBuilder']>,
    query: ReportQueryDto,
  ): void {
    if (!query.userRole) {
      return;
    }

    qb.innerJoin(User, 'enrUser', 'enrUser.id = e."userId" AND enrUser."deletedAt" IS NULL')
      .andWhere('enrUser.role = :userRole', { userRole: query.userRole });
  }

  private async getOverviewMetrics(range: RangeWindow, query: ReportQueryDto): Promise<OverviewMetrics> {
    const usersQb = this.userRepository.createQueryBuilder('u').where('u."deletedAt" IS NULL');
    if (query.userRole) {
      usersQb.andWhere('u.role = :userRole', { userRole: query.userRole });
    }

    const teachersQb = usersQb.clone().andWhere('u.role = :teacherRole', { teacherRole: UserRole.TEACHER });

    const coursesQb = this.courseRepository.createQueryBuilder('c').where('c."deletedAt" IS NULL');
    this.applyCourseFilters(coursesQb, query);

    const enrollmentsQb = this.enrollmentRepository
      .createQueryBuilder('e')
      .where('e."deletedAt" IS NULL');

    if (query.enrollmentStatus) {
      enrollmentsQb.andWhere('e.status = :enrollmentStatus', {
        enrollmentStatus: query.enrollmentStatus,
      });
    }

    if (query.courseStatus || query.categoryId) {
      enrollmentsQb
        .innerJoin(Course, 'enrCourse', 'enrCourse.id = e."courseId" AND enrCourse."deletedAt" IS NULL');

      if (query.courseStatus) {
        enrollmentsQb.andWhere('enrCourse.status = :enrCourseStatus', {
          enrCourseStatus: query.courseStatus,
        });
      }

      if (query.categoryId) {
        enrollmentsQb.andWhere('enrCourse."categoryId" = :enrCategoryId', {
          enrCategoryId: query.categoryId,
        });
      }
    }

    this.applyUserRoleFilter(enrollmentsQb, query);

    const ticketsQb = this.ticketRepository.createQueryBuilder('t').where('t."deletedAt" IS NULL');
    if (query.ticketStatus) {
      ticketsQb.andWhere('t.status = :ticketStatus', { ticketStatus: query.ticketStatus });
    }

    if (query.userRole) {
      ticketsQb
        .innerJoin(User, 'ticketUser', 'ticketUser.id = t."userId" AND ticketUser."deletedAt" IS NULL')
        .andWhere('ticketUser.role = :ticketUserRole', { ticketUserRole: query.userRole });
    }

    const revenueQb = this.enrollmentRepository
      .createQueryBuilder('e')
      .innerJoin(Course, 'c', 'c.id = e."courseId" AND c."deletedAt" IS NULL')
      .where('e."deletedAt" IS NULL')
      .andWhere('e."createdAt" BETWEEN :start AND :end', { start: range.start, end: range.end })
      .andWhere('e.status IN (:...revenueStatuses)', {
        revenueStatuses: this.resolveRevenueStatuses(query.enrollmentStatus),
      })
      .select('COALESCE(SUM(COALESCE(c."discountPrice", c.price)), 0)', 'grossRevenue')
      .addSelect('COUNT(e.id)', 'revenueEnrollments');

    if (query.courseStatus) {
      revenueQb.andWhere('c.status = :revenueCourseStatus', { revenueCourseStatus: query.courseStatus });
    }

    if (query.categoryId) {
      revenueQb.andWhere('c."categoryId" = :revenueCategoryId', { revenueCategoryId: query.categoryId });
    }

    this.applyUserRoleFilter(revenueQb, query);

    const [
      totalUsers,
      totalTeachers,
      totalCourses,
      newUsers,
      newCourses,
      publishedCourses,
      enrollments,
      tickets,
      openTickets,
      pendingCourses,
      revenueRaw,
    ] = await Promise.all([
      usersQb.clone().getCount(),
      teachersQb.clone().getCount(),
      coursesQb.clone().getCount(),
      usersQb.clone().andWhere('u."createdAt" BETWEEN :start AND :end', { start: range.start, end: range.end }).getCount(),
      coursesQb.clone().andWhere('c."createdAt" BETWEEN :start AND :end', { start: range.start, end: range.end }).getCount(),
      coursesQb
        .clone()
        .andWhere('c.status = :publishedStatus', { publishedStatus: CourseStatus.PUBLISHED })
        .andWhere('c."publishedAt" BETWEEN :start AND :end', { start: range.start, end: range.end })
        .getCount(),
      enrollmentsQb
        .clone()
        .andWhere('e."createdAt" BETWEEN :start AND :end', { start: range.start, end: range.end })
        .getCount(),
      ticketsQb
        .clone()
        .andWhere('t."createdAt" BETWEEN :start AND :end', { start: range.start, end: range.end })
        .getCount(),
      ticketsQb
        .clone()
        .andWhere('t.status = :openStatus', { openStatus: TicketStatus.OPEN })
        .getCount(),
      coursesQb
        .clone()
        .andWhere('c.status = :pendingStatus', { pendingStatus: CourseStatus.PENDING })
        .getCount(),
      revenueQb.getRawOne<{ grossRevenue: string; revenueEnrollments: string }>(),
    ]);

    return {
      totalUsers,
      totalTeachers,
      totalCourses,
      newUsers,
      newCourses,
      publishedCourses,
      enrollments,
      tickets,
      openTickets,
      pendingCourses,
      grossRevenue: Number(revenueRaw?.grossRevenue ?? 0),
      revenueEnrollments: Number(revenueRaw?.revenueEnrollments ?? 0),
    };
  }

  private async getUsersByRole(query: ReportQueryDto): Promise<Array<{ role: string; count: number }>> {
    const qb = this.userRepository.createQueryBuilder('u').where('u."deletedAt" IS NULL');

    if (query.userRole) {
      qb.andWhere('u.role = :userRole', { userRole: query.userRole });
    }

    const raw = await qb
      .select('u.role', 'role')
      .addSelect('COUNT(u.id)', 'count')
      .groupBy('u.role')
      .getRawMany<{ role: string; count: string }>();

    return raw.map((item) => ({ role: item.role, count: Number(item.count) }));
  }

  private async getCoursesByStatus(query: ReportQueryDto): Promise<Array<{ status: string; count: number }>> {
    const qb = this.courseRepository.createQueryBuilder('c').where('c."deletedAt" IS NULL');
    this.applyCourseFilters(qb, query);

    const raw = await qb
      .select('c.status', 'status')
      .addSelect('COUNT(c.id)', 'count')
      .groupBy('c.status')
      .getRawMany<{ status: string; count: string }>();

    return raw.map((item) => ({ status: item.status, count: Number(item.count) }));
  }

  private async getEnrollmentsByStatus(query: ReportQueryDto): Promise<Array<{ status: string; count: number }>> {
    const qb = this.enrollmentRepository
      .createQueryBuilder('e')
      .where('e."deletedAt" IS NULL');

    if (query.enrollmentStatus) {
      qb.andWhere('e.status = :enrollmentStatus', {
        enrollmentStatus: query.enrollmentStatus,
      });
    }

    if (query.courseStatus || query.categoryId) {
      qb.innerJoin(Course, 'c', 'c.id = e."courseId" AND c."deletedAt" IS NULL');

      if (query.courseStatus) {
        qb.andWhere('c.status = :courseStatus', { courseStatus: query.courseStatus });
      }

      if (query.categoryId) {
        qb.andWhere('c."categoryId" = :categoryId', { categoryId: query.categoryId });
      }
    }

    this.applyUserRoleFilter(qb, query);

    const raw = await qb
      .select('e.status', 'status')
      .addSelect('COUNT(e.id)', 'count')
      .groupBy('e.status')
      .getRawMany<{ status: string; count: string }>();

    return raw.map((item) => ({ status: item.status, count: Number(item.count) }));
  }

  private async getTicketsByStatus(query: ReportQueryDto): Promise<Array<{ status: string; count: number }>> {
    const qb = this.ticketRepository.createQueryBuilder('t').where('t."deletedAt" IS NULL');

    if (query.ticketStatus) {
      qb.andWhere('t.status = :ticketStatus', { ticketStatus: query.ticketStatus });
    }

    if (query.userRole) {
      qb
        .innerJoin(User, 'ticketUser', 'ticketUser.id = t."userId" AND ticketUser."deletedAt" IS NULL')
        .andWhere('ticketUser.role = :ticketUserRole', { ticketUserRole: query.userRole });
    }

    const raw = await qb
      .select('t.status', 'status')
      .addSelect('COUNT(t.id)', 'count')
      .groupBy('t.status')
      .getRawMany<{ status: string; count: string }>();

    return raw.map((item) => ({ status: item.status, count: Number(item.count) }));
  }

  private async getRevenueByCategory(
    range: RangeWindow,
    query: ReportQueryDto,
  ): Promise<Array<{ categoryId: string | null; categoryName: string; revenue: number; enrollments: number }>> {
    const qb = this.enrollmentRepository
      .createQueryBuilder('e')
      .innerJoin(Course, 'c', 'c.id = e."courseId" AND c."deletedAt" IS NULL')
      .leftJoin(Category, 'cat', 'cat.id = c."categoryId" AND cat."deletedAt" IS NULL')
      .where('e."deletedAt" IS NULL')
      .andWhere('e."createdAt" BETWEEN :start AND :end', { start: range.start, end: range.end })
      .andWhere('e.status IN (:...revenueStatuses)', {
        revenueStatuses: this.resolveRevenueStatuses(query.enrollmentStatus),
      });

    if (query.courseStatus) {
      qb.andWhere('c.status = :courseStatus', { courseStatus: query.courseStatus });
    }

    if (query.categoryId) {
      qb.andWhere('c."categoryId" = :categoryId', { categoryId: query.categoryId });
    }

    this.applyUserRoleFilter(qb, query);

    const raw = await qb
      .select('c."categoryId"', 'categoryId')
      .addSelect('COALESCE(cat.name, :unknownCategory)', 'categoryName')
      .addSelect('COUNT(e.id)', 'enrollments')
      .addSelect('COALESCE(SUM(COALESCE(c."discountPrice", c.price)), 0)', 'revenue')
      .setParameter('unknownCategory', 'Khác')
      .groupBy('c."categoryId"')
      .addGroupBy('cat.name')
      .orderBy('revenue', 'DESC')
      .getRawMany<{ categoryId: string | null; categoryName: string; enrollments: string; revenue: string }>();

    return raw.map((item) => ({
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      enrollments: Number(item.enrollments),
      revenue: Number(item.revenue),
    }));
  }

  private formatBucketSql(groupBy: Exclude<ReportGroupBy, ReportGroupBy.AUTO>, columnExpr: string): string {
    if (groupBy === ReportGroupBy.DAY) {
      return `to_char(date_trunc('day', ${columnExpr}), 'YYYY-MM-DD')`;
    }

    if (groupBy === ReportGroupBy.WEEK) {
      return `to_char(date_trunc('week', ${columnExpr}), 'YYYY-MM-DD')`;
    }

    return `to_char(date_trunc('month', ${columnExpr}), 'YYYY-MM')`;
  }

  private formatBucketKey(date: Dayjs, groupBy: Exclude<ReportGroupBy, ReportGroupBy.AUTO>): string {
    if (groupBy === ReportGroupBy.MONTH) {
      return date.format('YYYY-MM');
    }
    return date.format('YYYY-MM-DD');
  }

  private formatBucketLabel(
    key: string,
    groupBy: Exclude<ReportGroupBy, ReportGroupBy.AUTO>,
  ): string {
    if (groupBy === ReportGroupBy.MONTH) {
      return dayjs(`${key}-01`).format('MM/YYYY');
    }

    if (groupBy === ReportGroupBy.WEEK) {
      return `Tuần ${dayjs(key).format('DD/MM')}`;
    }

    return dayjs(key).format('DD/MM');
  }

  private alignToIsoWeekStart(date: Dayjs): Dayjs {
    const weekday = date.day();
    const offset = (weekday + 6) % 7;
    return date.subtract(offset, 'day').startOf('day');
  }

  private buildBucketKeys(
    range: RangeWindow,
    groupBy: Exclude<ReportGroupBy, ReportGroupBy.AUTO>,
  ): string[] {
    let cursor = dayjs(range.start);
    const end = dayjs(range.end);

    if (groupBy === ReportGroupBy.DAY) {
      cursor = cursor.startOf('day');
    }

    if (groupBy === ReportGroupBy.WEEK) {
      cursor = this.alignToIsoWeekStart(cursor);
    }

    if (groupBy === ReportGroupBy.MONTH) {
      cursor = cursor.startOf('month');
    }

    const keys: string[] = [];
    while (cursor.isBefore(end) || cursor.isSame(end)) {
      keys.push(this.formatBucketKey(cursor, groupBy));

      if (groupBy === ReportGroupBy.DAY) {
        cursor = cursor.add(1, 'day');
      } else if (groupBy === ReportGroupBy.WEEK) {
        cursor = cursor.add(1, 'week');
      } else {
        cursor = cursor.add(1, 'month');
      }
    }

    return keys;
  }

  private async getTrendSeries(
    range: RangeWindow,
    groupBy: Exclude<ReportGroupBy, ReportGroupBy.AUTO>,
    query: ReportQueryDto,
  ): Promise<{
    labels: string[];
    users: number[];
    courses: number[];
    enrollments: number[];
    tickets: number[];
    revenue: number[];
  }> {
    const usersBucketExpr = this.formatBucketSql(groupBy, 'u."createdAt"');
    const coursesBucketExpr = this.formatBucketSql(groupBy, 'c."createdAt"');
    const enrollmentsBucketExpr = this.formatBucketSql(groupBy, 'e."createdAt"');
    const ticketsBucketExpr = this.formatBucketSql(groupBy, 't."createdAt"');

    const usersQb = this.userRepository
      .createQueryBuilder('u')
      .where('u."deletedAt" IS NULL')
      .andWhere('u."createdAt" BETWEEN :start AND :end', { start: range.start, end: range.end });

    if (query.userRole) {
      usersQb.andWhere('u.role = :userRole', { userRole: query.userRole });
    }

    const coursesQb = this.courseRepository
      .createQueryBuilder('c')
      .where('c."deletedAt" IS NULL')
      .andWhere('c."createdAt" BETWEEN :start AND :end', { start: range.start, end: range.end });
    this.applyCourseFilters(coursesQb, query);

    const enrollmentsQb = this.enrollmentRepository
      .createQueryBuilder('e')
      .where('e."deletedAt" IS NULL')
      .andWhere('e."createdAt" BETWEEN :start AND :end', { start: range.start, end: range.end });

    if (query.enrollmentStatus) {
      enrollmentsQb.andWhere('e.status = :enrollmentStatus', {
        enrollmentStatus: query.enrollmentStatus,
      });
    }

    if (query.courseStatus || query.categoryId) {
      enrollmentsQb
        .innerJoin(Course, 'enrCourse', 'enrCourse.id = e."courseId" AND enrCourse."deletedAt" IS NULL');

      if (query.courseStatus) {
        enrollmentsQb.andWhere('enrCourse.status = :enrCourseStatus', {
          enrCourseStatus: query.courseStatus,
        });
      }

      if (query.categoryId) {
        enrollmentsQb.andWhere('enrCourse."categoryId" = :enrCategoryId', {
          enrCategoryId: query.categoryId,
        });
      }
    }

    this.applyUserRoleFilter(enrollmentsQb, query);

    const ticketsQb = this.ticketRepository
      .createQueryBuilder('t')
      .where('t."deletedAt" IS NULL')
      .andWhere('t."createdAt" BETWEEN :start AND :end', { start: range.start, end: range.end });

    if (query.ticketStatus) {
      ticketsQb.andWhere('t.status = :ticketStatus', { ticketStatus: query.ticketStatus });
    }

    if (query.userRole) {
      ticketsQb
        .innerJoin(User, 'ticketUser', 'ticketUser.id = t."userId" AND ticketUser."deletedAt" IS NULL')
        .andWhere('ticketUser.role = :ticketUserRole', { ticketUserRole: query.userRole });
    }

    const revenueQb = this.enrollmentRepository
      .createQueryBuilder('e')
      .innerJoin(Course, 'c', 'c.id = e."courseId" AND c."deletedAt" IS NULL')
      .where('e."deletedAt" IS NULL')
      .andWhere('e."createdAt" BETWEEN :start AND :end', { start: range.start, end: range.end })
      .andWhere('e.status IN (:...revenueStatuses)', {
        revenueStatuses: this.resolveRevenueStatuses(query.enrollmentStatus),
      });

    if (query.courseStatus) {
      revenueQb.andWhere('c.status = :courseStatus', { courseStatus: query.courseStatus });
    }

    if (query.categoryId) {
      revenueQb.andWhere('c."categoryId" = :categoryId', { categoryId: query.categoryId });
    }

    this.applyUserRoleFilter(revenueQb, query);

    const revenueBucketExpr = this.formatBucketSql(groupBy, 'e."createdAt"');

    const [usersRaw, coursesRaw, enrollmentsRaw, ticketsRaw, revenueRaw] = await Promise.all([
      usersQb
        .clone()
        .select(usersBucketExpr, 'bucket')
        .addSelect('COUNT(u.id)', 'value')
        .groupBy('bucket')
        .orderBy('bucket', 'ASC')
        .getRawMany<{ bucket: string; value: string }>(),
      coursesQb
        .clone()
        .select(coursesBucketExpr, 'bucket')
        .addSelect('COUNT(c.id)', 'value')
        .groupBy('bucket')
        .orderBy('bucket', 'ASC')
        .getRawMany<{ bucket: string; value: string }>(),
      enrollmentsQb
        .clone()
        .select(enrollmentsBucketExpr, 'bucket')
        .addSelect('COUNT(e.id)', 'value')
        .groupBy('bucket')
        .orderBy('bucket', 'ASC')
        .getRawMany<{ bucket: string; value: string }>(),
      ticketsQb
        .clone()
        .select(ticketsBucketExpr, 'bucket')
        .addSelect('COUNT(t.id)', 'value')
        .groupBy('bucket')
        .orderBy('bucket', 'ASC')
        .getRawMany<{ bucket: string; value: string }>(),
      revenueQb
        .clone()
        .select(revenueBucketExpr, 'bucket')
        .addSelect('COALESCE(SUM(COALESCE(c."discountPrice", c.price)), 0)', 'value')
        .groupBy('bucket')
        .orderBy('bucket', 'ASC')
        .getRawMany<{ bucket: string; value: string }>(),
    ]);

    const buckets = this.buildBucketKeys(range, groupBy);

    const usersMap = new Map(usersRaw.map((item) => [item.bucket, Number(item.value)]));
    const coursesMap = new Map(coursesRaw.map((item) => [item.bucket, Number(item.value)]));
    const enrollmentsMap = new Map(enrollmentsRaw.map((item) => [item.bucket, Number(item.value)]));
    const ticketsMap = new Map(ticketsRaw.map((item) => [item.bucket, Number(item.value)]));
    const revenueMap = new Map(revenueRaw.map((item) => [item.bucket, Number(item.value)]));

    return {
      labels: buckets.map((key) => this.formatBucketLabel(key, groupBy)),
      users: buckets.map((key) => usersMap.get(key) ?? 0),
      courses: buckets.map((key) => coursesMap.get(key) ?? 0),
      enrollments: buckets.map((key) => enrollmentsMap.get(key) ?? 0),
      tickets: buckets.map((key) => ticketsMap.get(key) ?? 0),
      revenue: buckets.map((key) => revenueMap.get(key) ?? 0),
    };
  }

  private async getTopCourses(
    range: RangeWindow,
    query: ReportQueryDto,
  ): Promise<
    Array<{
      id: string;
      title: string;
      thumbnail: string | null;
      totalStudents: number;
      rating: number;
      teacher: {
        id: string;
        name: string;
      };
    }>
  > {
    const qb = this.enrollmentRepository
      .createQueryBuilder('e')
      .innerJoin(Course, 'c', 'c.id = e."courseId" AND c."deletedAt" IS NULL')
      .leftJoin(User, 'teacher', 'teacher.id = c."teacherId"')
      .where('e."deletedAt" IS NULL')
      .andWhere('e."createdAt" BETWEEN :start AND :end', { start: range.start, end: range.end })
      .andWhere('e.status IN (:...validStatuses)', {
        validStatuses: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED],
      });

    if (query.courseStatus) {
      qb.andWhere('c.status = :courseStatus', { courseStatus: query.courseStatus });
    }

    if (query.categoryId) {
      qb.andWhere('c."categoryId" = :categoryId', { categoryId: query.categoryId });
    }

    if (query.enrollmentStatus) {
      qb.andWhere('e.status = :enrollmentStatus', {
        enrollmentStatus: query.enrollmentStatus,
      });
    }

    this.applyUserRoleFilter(qb, query);

    const raw = await qb
      .select('c.id', 'id')
      .addSelect('c.title', 'title')
      .addSelect('c.thumbnail', 'thumbnail')
      .addSelect('c.rating', 'rating')
      .addSelect('teacher.id', 'teacherId')
      .addSelect('teacher."firstName"', 'teacherFirstName')
      .addSelect('teacher."lastName"', 'teacherLastName')
      .addSelect('COUNT(e.id)', 'totalStudents')
      .addSelect('COALESCE(SUM(COALESCE(c."discountPrice", c.price)), 0)', 'revenue')
      .groupBy('c.id')
      .addGroupBy('teacher.id')
      .addGroupBy('teacher."firstName"')
      .addGroupBy('teacher."lastName"')
      .orderBy('revenue', 'DESC')
      .limit(5)
      .getRawMany<{
        id: string;
        title: string;
        thumbnail: string | null;
        rating: string;
        teacherId: string;
        teacherFirstName: string | null;
        teacherLastName: string | null;
        totalStudents: string;
      }>();

    return raw.map((item) => ({
      id: item.id,
      title: item.title,
      thumbnail: item.thumbnail,
      totalStudents: Number(item.totalStudents),
      rating: Number(item.rating ?? 0),
      teacher: {
        id: item.teacherId,
        name: `${item.teacherFirstName ?? ''} ${item.teacherLastName ?? ''}`.trim(),
      },
    }));
  }

  private async getTopTeachers(
    range: RangeWindow,
    query: ReportQueryDto,
  ): Promise<
    Array<{
      id: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
      totalCourses: number;
      totalStudents: number;
      rating: number;
    }>
  > {
    const qb = this.courseRepository
      .createQueryBuilder('c')
      .innerJoin(User, 'u', 'u.id = c."teacherId" AND u."deletedAt" IS NULL')
      .leftJoin(Enrollment, 'e', 'e."courseId" = c.id AND e."deletedAt" IS NULL')
      .where('c."deletedAt" IS NULL');

    if (query.courseStatus) {
      qb.andWhere('c.status = :courseStatus', { courseStatus: query.courseStatus });
    }

    if (query.categoryId) {
      qb.andWhere('c."categoryId" = :categoryId', { categoryId: query.categoryId });
    }

    if (query.userRole) {
      qb.andWhere('u.role = :userRole', { userRole: query.userRole });
    }

    qb.andWhere('c."createdAt" <= :rangeEnd', { rangeEnd: range.end });

    if (query.enrollmentStatus) {
      qb.andWhere('(e.id IS NULL OR e.status = :enrollmentStatus)', {
        enrollmentStatus: query.enrollmentStatus,
      });
    }

    const raw = await qb
      .select('u.id', 'id')
      .addSelect('u."firstName"', 'firstName')
      .addSelect('u."lastName"', 'lastName')
      .addSelect('u.avatar', 'avatar')
      .addSelect('COUNT(DISTINCT c.id)', 'totalCourses')
      .addSelect('COUNT(e.id)', 'totalStudents')
      .addSelect('COALESCE(AVG(c.rating), 0)', 'rating')
      .groupBy('u.id')
      .addGroupBy('u."firstName"')
      .addGroupBy('u."lastName"')
      .addGroupBy('u.avatar')
      .orderBy('"totalStudents"', 'DESC')
      .limit(5)
      .getRawMany<{
        id: string;
        firstName: string | null;
        lastName: string | null;
        avatar: string | null;
        totalCourses: string;
        totalStudents: string;
        rating: string;
      }>();

    return raw.map((item) => ({
      id: item.id,
      firstName: item.firstName ?? '',
      lastName: item.lastName ?? '',
      avatar: item.avatar,
      totalCourses: Number(item.totalCourses),
      totalStudents: Number(item.totalStudents),
      rating: Number(item.rating),
    }));
  }

  private async getRecentTickets(
    range: RangeWindow,
    query: ReportQueryDto,
  ): Promise<
    Array<{
      id: string;
      ticketId: string;
      userName: string;
      subject: string;
      status: string;
      createdAt: string;
    }>
  > {
    const qb = this.ticketRepository
      .createQueryBuilder('t')
      .leftJoin(User, 'u', 'u.id = t."userId"')
      .where('t."deletedAt" IS NULL')
      .andWhere('t."createdAt" BETWEEN :start AND :end', { start: range.start, end: range.end });

    if (query.ticketStatus) {
      qb.andWhere('t.status = :ticketStatus', { ticketStatus: query.ticketStatus });
    }

    if (query.userRole) {
      qb.andWhere('u.role = :userRole', { userRole: query.userRole });
    }

    const rows = await qb
      .select('t.id', 'id')
      .addSelect('t.subject', 'subject')
      .addSelect('t.status', 'status')
      .addSelect('t."createdAt"', 'createdAt')
      .addSelect('u."firstName"', 'firstName')
      .addSelect('u."lastName"', 'lastName')
      .orderBy('t."createdAt"', 'DESC')
      .limit(5)
      .getRawMany<{
        id: string;
        subject: string;
        status: string;
        createdAt: string;
        firstName: string | null;
        lastName: string | null;
      }>();

    return rows.map((item) => ({
      id: item.id,
      ticketId: item.id.slice(0, 8).toUpperCase(),
      userName: `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim(),
      subject: item.subject,
      status: item.status,
      createdAt: item.createdAt,
    }));
  }

  private async getCourseCategoryDistribution(
    query: ReportQueryDto,
  ): Promise<Array<{ categoryName: string; count: number }>> {
    const qb = this.courseRepository
      .createQueryBuilder('c')
      .leftJoin(Category, 'cat', 'cat.id = c."categoryId" AND cat."deletedAt" IS NULL')
      .where('c."deletedAt" IS NULL');

    this.applyCourseFilters(qb, query);

    const rows = await qb
      .select('COALESCE(cat.name, :unknownCategory)', 'categoryName')
      .addSelect('COUNT(c.id)', 'count')
      .setParameter('unknownCategory', 'Khác')
      .groupBy('cat.name')
      .orderBy('count', 'DESC')
      .getRawMany<{ categoryName: string; count: string }>();

    return rows.map((item) => ({
      categoryName: item.categoryName,
      count: Number(item.count),
    }));
  }

  private async getTodayStats(query: ReportQueryDto): Promise<{ newUsersToday: number; newCoursesToday: number }> {
    const start = dayjs().startOf('day').toDate();
    const end = dayjs().endOf('day').toDate();

    const usersQb = this.userRepository.createQueryBuilder('u').where('u."deletedAt" IS NULL');
    if (query.userRole) {
      usersQb.andWhere('u.role = :userRole', { userRole: query.userRole });
    }

    const coursesQb = this.courseRepository.createQueryBuilder('c').where('c."deletedAt" IS NULL');
    this.applyCourseFilters(coursesQb, query);

    const [newUsersToday, newCoursesToday] = await Promise.all([
      usersQb
        .clone()
        .andWhere('u."createdAt" BETWEEN :start AND :end', { start, end })
        .getCount(),
      coursesQb
        .clone()
        .andWhere('c."createdAt" BETWEEN :start AND :end', { start, end })
        .getCount(),
    ]);

    return { newUsersToday, newCoursesToday };
  }

  private escapeCsvCell(value: string | number): string {
    const normalized = String(value ?? '');
    if (normalized.includes(',') || normalized.includes('"') || normalized.includes('\n')) {
      return `"${normalized.replace(/"/g, '""')}"`;
    }
    return normalized;
  }

  private toCsv(payload: ReportPayload): string {
    const lines: string[] = [];

    const pushRow = (...cols: Array<string | number>) => {
      lines.push(cols.map((value) => this.escapeCsvCell(value)).join(','));
    };

    pushRow('EduNet Report');
    pushRow('Generated At', payload.generatedAt);
    pushRow('Range Start', payload.range.startDate);
    pushRow('Range End', payload.range.endDate);
    pushRow('Days', payload.range.days);
    pushRow('Group By', payload.range.groupBy);
    lines.push('');

    pushRow('Overview');
    pushRow(
      'totalUsers',
      'totalTeachers',
      'totalCourses',
      'newUsers',
      'newCourses',
      'publishedCourses',
      'enrollments',
      'tickets',
      'grossRevenue',
    );
    pushRow(
      payload.overview.totalUsers,
      payload.overview.totalTeachers,
      payload.overview.totalCourses,
      payload.overview.newUsers,
      payload.overview.newCourses,
      payload.overview.publishedCourses,
      payload.overview.enrollments,
      payload.overview.tickets,
      payload.overview.grossRevenue,
    );
    lines.push('');

    pushRow('Users By Role');
    pushRow('role', 'count');
    payload.breakdowns.usersByRole.forEach((item) => pushRow(item.role, item.count));
    lines.push('');

    pushRow('Courses By Status');
    pushRow('status', 'count');
    payload.breakdowns.coursesByStatus.forEach((item) => pushRow(item.status, item.count));
    lines.push('');

    pushRow('Enrollments By Status');
    pushRow('status', 'count');
    payload.breakdowns.enrollmentsByStatus.forEach((item) => pushRow(item.status, item.count));
    lines.push('');

    pushRow('Tickets By Status');
    pushRow('status', 'count');
    payload.breakdowns.ticketsByStatus.forEach((item) => pushRow(item.status, item.count));
    lines.push('');

    pushRow('Revenue By Category');
    pushRow('categoryId', 'categoryName', 'enrollments', 'revenue');
    payload.breakdowns.revenueByCategory.forEach((item) =>
      pushRow(item.categoryId ?? '', item.categoryName, item.enrollments, item.revenue),
    );
    lines.push('');

    pushRow('Trend Series');
    pushRow('period', 'users', 'courses', 'enrollments', 'tickets', 'revenue');
    payload.trends.labels.forEach((label, index) => {
      pushRow(
        label,
        payload.trends.users[index] ?? 0,
        payload.trends.courses[index] ?? 0,
        payload.trends.enrollments[index] ?? 0,
        payload.trends.tickets[index] ?? 0,
        payload.trends.revenue[index] ?? 0,
      );
    });

    return lines.join('\n');
  }
}
