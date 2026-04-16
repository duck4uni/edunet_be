import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike, MoreThanOrEqual } from 'typeorm';
import { SuccessResponse } from '../core/responses/base.responses';
import { Enrollment } from '../enrollment/entities/enrollment.entity';
import { Assignment } from '../assignment/entities/assignment.entity';
import { Schedule } from '../schedule/entities/schedule.entity';
import { Course } from '../course/entities/course.entity';
import { Quiz } from '../quiz/entities/quiz.entity';
import { QuizAttempt } from '../quiz/entities/quiz-attempt.entity';
import { Lesson } from '../lesson/entities/lesson.entity';
import { Material } from '../material/entities/material.entity';
import { Category } from '../category/entities/category.entity';
import { User } from '../user/entities/user.entity';

type Intent =
  | 'my_courses'
  | 'my_assignments'
  | 'my_schedule'
  | 'my_progress'
  | 'my_quizzes'
  | 'my_materials'
  | 'search_courses'
  | 'course_detail'
  | 'categories'
  | 'upcoming_deadlines'
  | 'my_grades'
  | 'course_recommendations'
  | 'my_profile'
  | 'help'
  | 'unknown';

interface IntentResult {
  intent: Intent;
  params: Record<string, string>;
}

@Injectable()
export class PersonalAssistantService {
  constructor(
    @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Assignment) private assignmentRepo: Repository<Assignment>,
    @InjectRepository(Schedule) private scheduleRepo: Repository<Schedule>,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(Quiz) private quizRepo: Repository<Quiz>,
    @InjectRepository(QuizAttempt) private quizAttemptRepo: Repository<QuizAttempt>,
    @InjectRepository(Lesson) private lessonRepo: Repository<Lesson>,
    @InjectRepository(Material) private materialRepo: Repository<Material>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async handleQuestion(userId: string, question: string) {
    const { intent, params } = this.detectIntent(question);

    let answer: string;
    let data: any = null;

    switch (intent) {
      case 'my_courses':
        ({ answer, data } = await this.getMyCourses(userId));
        break;
      case 'my_assignments':
        ({ answer, data } = await this.getMyAssignments(userId));
        break;
      case 'my_schedule':
        ({ answer, data } = await this.getMySchedule(userId));
        break;
      case 'my_progress':
        ({ answer, data } = await this.getMyProgress(userId));
        break;
      case 'my_quizzes':
        ({ answer, data } = await this.getMyQuizzes(userId));
        break;
      case 'my_grades':
        ({ answer, data } = await this.getMyGrades(userId));
        break;
      case 'my_materials':
        ({ answer, data } = await this.getMyMaterials(userId));
        break;
      case 'upcoming_deadlines':
        ({ answer, data } = await this.getUpcomingDeadlines(userId));
        break;
      case 'search_courses':
        ({ answer, data } = await this.searchCourses(params.keyword));
        break;
      case 'course_detail':
        ({ answer, data } = await this.getCourseDetail(params.keyword));
        break;
      case 'categories':
        ({ answer, data } = await this.getCategories());
        break;
      case 'course_recommendations':
        ({ answer, data } = await this.getCourseRecommendations(userId));
        break;
      case 'my_profile':
        ({ answer, data } = await this.getMyProfile(userId));
        break;
      case 'help':
        answer = this.getHelpText();
        break;
      default:
        answer = this.getUnknownText(question);
        break;
    }

    return new SuccessResponse({ intent, answer, data });
  }

  // ──────────────────── Intent detection ────────────────────

  private detectIntent(question: string): IntentResult {
    const q = question.toLowerCase().normalize('NFC');

    // Help
    if (/giúp|help|hướng dẫn|bạn làm được gì|có thể hỏi gì|chức năng/.test(q)) {
      return { intent: 'help', params: {} };
    }

    // My profile
    if (/thông tin (của )?tôi|hồ sơ|profile|tài khoản/.test(q)) {
      return { intent: 'my_profile', params: {} };
    }

    // Schedule / timetable
    if (/lịch học|thời khóa biểu|tkb|lịch (của )?tôi|schedule|timetable|lịch hôm nay|lịch tuần|lịch ngày/.test(q)) {
      return { intent: 'my_schedule', params: {} };
    }

    // Deadlines
    if (/deadline|hạn nộp|hạn chót|sắp đến hạn|sắp hết hạn/.test(q)) {
      return { intent: 'upcoming_deadlines', params: {} };
    }

    // Grades
    if (/điểm (số|của|tôi)|điểm bài|kết quả (bài|kiểm tra)|grade|score|bảng điểm/.test(q)) {
      return { intent: 'my_grades', params: {} };
    }

    // Assignments
    if (/bài tập|assignment|homework|bài làm|bài nộp|nộp bài/.test(q)) {
      return { intent: 'my_assignments', params: {} };
    }

    // Quizzes
    if (/quiz|kiểm tra|trắc nghiệm|bài test|bài kiểm/.test(q)) {
      return { intent: 'my_quizzes', params: {} };
    }

    // Progress
    if (/tiến độ|tiến trình|progress|hoàn thành|đã học được|học đến đâu/.test(q)) {
      return { intent: 'my_progress', params: {} };
    }

    // Materials
    if (/tài liệu|material|tư liệu|giáo trình|slide|pdf/.test(q)) {
      return { intent: 'my_materials', params: {} };
    }

    // Categories
    if (/danh mục|ngành|lĩnh vực|chủ đề|category|categories|chuyên ngành/.test(q)) {
      return { intent: 'categories', params: {} };
    }

    // Course recommendation
    if (/gợi ý|đề xuất|recommend|nên học gì|khóa nào hay|phù hợp/.test(q)) {
      return { intent: 'course_recommendations', params: {} };
    }

    // Course detail (specific course name)
    if (/chi tiết (khóa|khoá|course)|thông tin (khóa|khoá)|nội dung (khóa|khoá)/.test(q)) {
      const keyword = q
        .replace(/chi tiết (khóa|khoá|course)|thông tin (khóa|khoá)|nội dung (khóa|khoá)/, '')
        .replace(/[?!.,]/g, '')
        .trim();
      return { intent: 'course_detail', params: { keyword } };
    }

    // Search courses (general)
    if (/tìm (khóa|khoá|course)|khóa học|khoá học|course|có (khóa|khoá)|đang mở|mở (khóa|khoá)|học về/.test(q)) {
      const keyword = q
        .replace(/tìm (khóa|khoá) học|tìm (khóa|khoá)|khóa học nào|khoá học nào|course|có (khóa|khoá) học nào|đang mở|hiện|nào|không|có|về|học|gì|được|hay/, '')
        .replace(/[?!.,]/g, '')
        .trim();
      return { intent: 'search_courses', params: { keyword } };
    }

    // My courses (fallback for "khóa của tôi" patterns)
    if (/khóa (của )?tôi|khoá (của )?tôi|đang học|đã đăng ký|my course|enrolled/.test(q)) {
      return { intent: 'my_courses', params: {} };
    }

    return { intent: 'unknown', params: {} };
  }

  // ──────────────────── Handlers ────────────────────

  private async getMyCourses(userId: string) {
    const enrollments = await this.enrollmentRepo.find({
      where: { userId, status: In(['active', 'pending', 'completed']) },
      relations: ['course', 'course.teacher', 'course.category'],
      order: { updatedAt: 'DESC' },
    });

    if (enrollments.length === 0) {
      return { answer: 'Bạn chưa đăng ký khóa học nào. Hãy thử hỏi "tìm khóa học" để khám phá!', data: [] };
    }

    const lines = enrollments.map((e, i) => {
      const c = e.course;
      const teacher = c.teacher ? `${c.teacher.firstName ?? ''} ${c.teacher.lastName ?? ''}`.trim() : 'N/A';
      const statusMap: Record<string, string> = { active: '📖 Đang học', pending: '⏳ Chờ duyệt', completed: '✅ Hoàn thành' };
      return `${i + 1}. **${c.title}** — ${statusMap[e.status] || e.status} | Tiến độ: ${e.progress}% | GV: ${teacher}`;
    });

    return {
      answer: `Bạn đang có ${enrollments.length} khóa học:\n\n${lines.join('\n')}`,
      data: enrollments.map((e) => ({
        enrollmentId: e.id,
        courseId: e.course.id,
        title: e.course.title,
        status: e.status,
        progress: e.progress,
        teacher: e.course.teacher
          ? `${e.course.teacher.firstName ?? ''} ${e.course.teacher.lastName ?? ''}`.trim()
          : null,
        category: e.course.category?.name ?? null,
      })),
    };
  }

  private async getMyAssignments(userId: string) {
    const assignments = await this.assignmentRepo.find({
      where: { studentId: userId },
      relations: ['course'],
      order: { dueDate: 'ASC' },
    });

    if (assignments.length === 0) {
      return { answer: 'Bạn chưa có bài tập nào.', data: [] };
    }

    const now = new Date();
    const pending = assignments.filter((a) => a.status === 'pending' && new Date(a.dueDate) > now);
    const overdue = assignments.filter((a) => a.status === 'pending' && new Date(a.dueDate) <= now);
    const submitted = assignments.filter((a) => a.status === 'submitted');
    const graded = assignments.filter((a) => a.status === 'graded');

    const lines: string[] = [];
    if (pending.length > 0) {
      lines.push(`📝 **Chưa nộp (${pending.length}):**`);
      pending.forEach((a) => {
        const due = new Date(a.dueDate).toLocaleDateString('vi-VN');
        lines.push(`  • ${a.title} — Hạn: ${due} — Khóa: ${a.course?.title ?? 'N/A'}`);
      });
    }
    if (overdue.length > 0) {
      lines.push(`⚠️ **Quá hạn (${overdue.length}):**`);
      overdue.forEach((a) => lines.push(`  • ${a.title} — Khóa: ${a.course?.title ?? 'N/A'}`));
    }
    if (submitted.length > 0) {
      lines.push(`📤 **Đã nộp, chờ chấm (${submitted.length}):**`);
      submitted.forEach((a) => lines.push(`  • ${a.title} — Khóa: ${a.course?.title ?? 'N/A'}`));
    }
    if (graded.length > 0) {
      lines.push(`✅ **Đã chấm điểm (${graded.length}):**`);
      graded.forEach((a) => lines.push(`  • ${a.title} — Điểm: ${a.grade}/${a.maxGrade}`));
    }

    return {
      answer: `Tổng hợp bài tập của bạn (${assignments.length} bài):\n\n${lines.join('\n')}`,
      data: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        dueDate: a.dueDate,
        grade: a.grade,
        maxGrade: a.maxGrade,
        course: a.course?.title ?? null,
      })),
    };
  }

  private async getMySchedule(userId: string) {
    // Get courses the user is enrolled in
    const enrollments = await this.enrollmentRepo.find({
      where: { userId, status: In(['active', 'pending']) },
      select: ['courseId'],
    });

    const courseIds = enrollments.map((e) => e.courseId);

    if (courseIds.length === 0) {
      return { answer: 'Bạn chưa đăng ký khóa học nào nên chưa có lịch học.', data: [] };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const schedules = await this.scheduleRepo.find({
      where: {
        courseId: In(courseIds),
        date: MoreThanOrEqual(today),
        status: 'scheduled' as any,
      },
      relations: ['course', 'teacher'],
      order: { date: 'ASC', startTime: 'ASC' },
      take: 20,
    });

    if (schedules.length === 0) {
      return { answer: 'Bạn không có lịch học sắp tới.', data: [] };
    }

    const lines = schedules.map((s) => {
      const dateStr = new Date(s.date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
      const teacher = s.teacher ? `${s.teacher.firstName ?? ''} ${s.teacher.lastName ?? ''}`.trim() : '';
      const location = s.isOnline ? `Online${s.meetingLink ? '' : ''}` : (s.location || 'N/A');
      return `📅 **${dateStr}** ${s.startTime}–${s.endTime} | ${s.title} | ${s.course?.title ?? ''} | ${location}${teacher ? ` | GV: ${teacher}` : ''}`;
    });

    return {
      answer: `Lịch học sắp tới của bạn:\n\n${lines.join('\n')}`,
      data: schedules.map((s) => ({
        id: s.id,
        title: s.title,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        course: s.course?.title ?? null,
        location: s.isOnline ? 'Online' : s.location,
        meetingLink: s.meetingLink,
        type: s.type,
      })),
    };
  }

  private async getMyProgress(userId: string) {
    const enrollments = await this.enrollmentRepo.find({
      where: { userId, status: In(['active', 'completed']) },
      relations: ['course'],
      order: { updatedAt: 'DESC' },
    });

    if (enrollments.length === 0) {
      return { answer: 'Bạn chưa có khóa học nào đang học.', data: [] };
    }

    const completed = enrollments.filter((e) => e.status === 'completed').length;
    const active = enrollments.filter((e) => e.status === 'active').length;
    const avgProgress = Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length);

    const lines = enrollments.map((e) => {
      const bar = this.progressBar(e.progress);
      return `• **${e.course.title}** ${bar} ${e.progress}%${e.status === 'completed' ? ' ✅' : ''}`;
    });

    return {
      answer: `📊 Tiến độ học tập của bạn:\n\nĐang học: ${active} | Hoàn thành: ${completed} | Trung bình: ${avgProgress}%\n\n${lines.join('\n')}`,
      data: enrollments.map((e) => ({
        courseId: e.courseId,
        title: e.course.title,
        progress: e.progress,
        status: e.status,
      })),
    };
  }

  private async getMyQuizzes(userId: string) {
    const enrollments = await this.enrollmentRepo.find({
      where: { userId, status: In(['active', 'completed']) },
      select: ['courseId'],
    });
    const courseIds = enrollments.map((e) => e.courseId);
    if (courseIds.length === 0) {
      return { answer: 'Bạn chưa đăng ký khóa học nào.', data: [] };
    }

    const quizzes = await this.quizRepo.find({
      where: { courseId: In(courseIds), isVisible: true },
      relations: ['course'],
      order: { createdAt: 'DESC' },
    });

    const attempts = await this.quizAttemptRepo.find({
      where: { studentId: userId },
      order: { createdAt: 'DESC' },
    });

    const attemptMap = new Map<string, typeof attempts>();
    attempts.forEach((a) => {
      const list = attemptMap.get(a.quizId) ?? [];
      list.push(a);
      attemptMap.set(a.quizId, list);
    });

    const lines = quizzes.map((quiz) => {
      const myAttempts = attemptMap.get(quiz.id);
      if (!myAttempts || myAttempts.length === 0) {
        return `📝 **${quiz.title}** — Chưa làm | Khóa: ${quiz.course?.title ?? 'N/A'}`;
      }
      const best = myAttempts.reduce((a, b) => ((a.score ?? 0) > (b.score ?? 0) ? a : b));
      const passed = (best.score ?? 0) >= quiz.passingScore;
      return `${passed ? '✅' : '❌'} **${quiz.title}** — Điểm cao nhất: ${best.score ?? 0}/${quiz.totalQuestions * 10} (${myAttempts.length} lần) | Khóa: ${quiz.course?.title ?? 'N/A'}`;
    });

    return {
      answer: `Bài kiểm tra của bạn (${quizzes.length} bài):\n\n${lines.join('\n')}`,
      data: quizzes.map((quiz) => {
        const myAttempts = attemptMap.get(quiz.id) ?? [];
        const best = myAttempts.length > 0 ? myAttempts.reduce((a, b) => ((a.score ?? 0) > (b.score ?? 0) ? a : b)) : null;
        return {
          quizId: quiz.id,
          title: quiz.title,
          course: quiz.course?.title ?? null,
          totalQuestions: quiz.totalQuestions,
          attempts: myAttempts.length,
          bestScore: best?.score ?? null,
          passingScore: quiz.passingScore,
        };
      }),
    };
  }

  private async getMyGrades(userId: string) {
    const assignments = await this.assignmentRepo.find({
      where: { studentId: userId, status: 'graded' as any },
      relations: ['course'],
      order: { updatedAt: 'DESC' },
    });

    const attempts = await this.quizAttemptRepo.find({
      where: { studentId: userId, status: 'completed' as any },
      relations: ['quiz', 'quiz.course'],
      order: { completedAt: 'DESC' },
    });

    const lines: string[] = [];

    if (assignments.length > 0) {
      lines.push('📝 **Điểm bài tập:**');
      assignments.forEach((a) => {
        lines.push(`  • ${a.title} — ${a.grade}/${a.maxGrade} | Khóa: ${a.course?.title ?? 'N/A'}`);
      });
    }

    if (attempts.length > 0) {
      lines.push('\n📋 **Điểm kiểm tra:**');
      attempts.forEach((a) => {
        lines.push(`  • ${a.quiz?.title ?? 'N/A'} — ${a.score ?? 0} điểm (${a.correctAnswers}/${a.totalAnswered} đúng) | Khóa: ${a.quiz?.course?.title ?? 'N/A'}`);
      });
    }

    if (lines.length === 0) {
      return { answer: 'Bạn chưa có điểm nào. Hãy hoàn thành bài tập và bài kiểm tra nhé!', data: [] };
    }

    return {
      answer: `Bảng điểm của bạn:\n\n${lines.join('\n')}`,
      data: {
        assignments: assignments.map((a) => ({
          title: a.title,
          grade: a.grade,
          maxGrade: a.maxGrade,
          course: a.course?.title ?? null,
        })),
        quizAttempts: attempts.map((a) => ({
          title: a.quiz?.title ?? null,
          score: a.score,
          correctAnswers: a.correctAnswers,
          totalAnswered: a.totalAnswered,
          course: a.quiz?.course?.title ?? null,
        })),
      },
    };
  }

  private async getMyMaterials(userId: string) {
    const enrollments = await this.enrollmentRepo.find({
      where: { userId, status: In(['active', 'completed']) },
      select: ['courseId'],
    });
    const courseIds = enrollments.map((e) => e.courseId);
    if (courseIds.length === 0) {
      return { answer: 'Bạn chưa đăng ký khóa học nào.', data: [] };
    }

    const materials = await this.materialRepo.find({
      where: { courseId: In(courseIds), isVisible: true },
      relations: ['course'],
      order: { createdAt: 'DESC' },
      take: 30,
    });

    if (materials.length === 0) {
      return { answer: 'Chưa có tài liệu nào cho các khóa học của bạn.', data: [] };
    }

    const grouped = new Map<string, typeof materials>();
    materials.forEach((m) => {
      const name = m.course?.title ?? 'Khác';
      const list = grouped.get(name) ?? [];
      list.push(m);
      grouped.set(name, list);
    });

    const lines: string[] = [];
    grouped.forEach((mats, courseName) => {
      lines.push(`📚 **${courseName}:**`);
      mats.forEach((m) => lines.push(`  • ${m.title} (${m.type})`));
    });

    return {
      answer: `Tài liệu học tập:\n\n${lines.join('\n')}`,
      data: materials.map((m) => ({
        id: m.id,
        title: m.title,
        type: m.type,
        course: m.course?.title ?? null,
        downloadUrl: m.downloadUrl,
      })),
    };
  }

  private async getUpcomingDeadlines(userId: string) {
    const now = new Date();

    const assignments = await this.assignmentRepo.find({
      where: {
        studentId: userId,
        status: 'pending' as any,
        dueDate: MoreThanOrEqual(now),
      },
      relations: ['course'],
      order: { dueDate: 'ASC' },
      take: 10,
    });

    if (assignments.length === 0) {
      return { answer: 'Bạn không có deadline sắp tới. Tuyệt vời! 🎉', data: [] };
    }

    const lines = assignments.map((a) => {
      const due = new Date(a.dueDate);
      const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const urgency = diff <= 1 ? '🔴' : diff <= 3 ? '🟡' : '🟢';
      return `${urgency} **${a.title}** — Còn ${diff} ngày (${due.toLocaleDateString('vi-VN')}) | Khóa: ${a.course?.title ?? 'N/A'}`;
    });

    return {
      answer: `⏰ Deadline sắp tới:\n\n${lines.join('\n')}`,
      data: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate,
        course: a.course?.title ?? null,
      })),
    };
  }

  private async searchCourses(keyword: string) {
    const where: any[] = [
      { status: 'published' as any },
    ];

    if (keyword) {
      where[0] = { status: 'published' as any, title: ILike(`%${keyword}%`) };
      where.push({ status: 'published' as any, tags: ILike(`%${keyword}%`) });
    }

    const courses = await this.courseRepo.find({
      where,
      relations: ['teacher', 'category'],
      order: { totalStudents: 'DESC' },
      take: 15,
    });

    if (courses.length === 0) {
      return {
        answer: keyword
          ? `Không tìm thấy khóa học nào với từ khóa "${keyword}". Thử từ khóa khác nhé!`
          : 'Hiện chưa có khóa học nào đang mở.',
        data: [],
      };
    }

    const lines = courses.map((c, i) => {
      const teacher = c.teacher ? `${c.teacher.firstName ?? ''} ${c.teacher.lastName ?? ''}`.trim() : 'N/A';
      const price = Number(c.price) > 0 ? `${Number(c.price).toLocaleString('vi-VN')}đ` : 'Miễn phí';
      return `${i + 1}. **${c.title}** — ${c.level} | ${price} | ⭐ ${c.rating} | ${c.totalStudents} học viên | GV: ${teacher}`;
    });

    return {
      answer: `${keyword ? `Kết quả tìm kiếm "${keyword}"` : 'Các khóa học đang mở'} (${courses.length}):\n\n${lines.join('\n')}`,
      data: courses.map((c) => ({
        id: c.id,
        title: c.title,
        level: c.level,
        price: c.price,
        rating: c.rating,
        totalStudents: c.totalStudents,
        category: c.category?.name ?? null,
        teacher: c.teacher ? `${c.teacher.firstName ?? ''} ${c.teacher.lastName ?? ''}`.trim() : null,
      })),
    };
  }

  private async getCourseDetail(keyword: string) {
    if (!keyword) {
      return { answer: 'Vui lòng cho mình biết tên khóa học bạn muốn xem chi tiết.', data: null };
    }

    const course = await this.courseRepo.findOne({
      where: { title: ILike(`%${keyword}%`), status: 'published' as any },
      relations: ['teacher', 'category', 'lessons'],
    });

    if (!course) {
      return { answer: `Không tìm thấy khóa học "${keyword}".`, data: null };
    }

    const teacher = course.teacher ? `${course.teacher.firstName ?? ''} ${course.teacher.lastName ?? ''}`.trim() : 'N/A';
    const price = Number(course.price) > 0 ? `${Number(course.price).toLocaleString('vi-VN')}đ` : 'Miễn phí';
    const lessons = course.lessons?.filter((l) => l.isVisible) ?? [];

    const lines = [
      `📘 **${course.title}**`,
      `📂 Danh mục: ${course.category?.name ?? 'N/A'}`,
      `👨‍🏫 Giảng viên: ${teacher}`,
      `📊 Trình độ: ${course.level} | 💰 Giá: ${price}`,
      `⭐ ${course.rating}/5 (${course.totalReviews} đánh giá) | 👥 ${course.totalStudents} học viên`,
      `📝 ${lessons.length} bài học${course.duration ? ` | ⏱ ${course.duration}` : ''}`,
    ];

    if (course.description) {
      lines.push(`\n📖 Mô tả: ${course.description.substring(0, 200)}${course.description.length > 200 ? '...' : ''}`);
    }

    if (lessons.length > 0) {
      lines.push('\n📋 Danh sách bài học:');
      lessons
        .sort((a, b) => a.order - b.order)
        .slice(0, 10)
        .forEach((l, i) => lines.push(`  ${i + 1}. ${l.title}`));
      if (lessons.length > 10) lines.push(`  ... và ${lessons.length - 10} bài nữa`);
    }

    return {
      answer: lines.join('\n'),
      data: {
        id: course.id,
        title: course.title,
        description: course.description,
        teacher,
        price: course.price,
        level: course.level,
        rating: course.rating,
        totalStudents: course.totalStudents,
        category: course.category?.name ?? null,
        lessonsCount: lessons.length,
      },
    };
  }

  private async getCategories() {
    const categories = await this.categoryRepo.find({
      where: { isActive: true },
      relations: ['courses'],
      order: { order: 'ASC' },
    });

    const lines = categories.map((cat) => {
      const publishedCount = cat.courses?.filter((c) => c.status === 'published').length ?? 0;
      return `📂 **${cat.name}** — ${publishedCount} khóa học đang mở`;
    });

    return {
      answer: `Các danh mục khóa học:\n\n${lines.join('\n')}\n\nHãy hỏi "tìm khóa học [tên danh mục]" để xem chi tiết!`,
      data: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        courseCount: cat.courses?.filter((c) => c.status === 'published').length ?? 0,
      })),
    };
  }

  private async getCourseRecommendations(userId: string) {
    // Get user's enrolled categories
    const enrollments = await this.enrollmentRepo.find({
      where: { userId },
      relations: ['course'],
      select: ['courseId'],
    });

    const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
    const enrolledCategoryIds = [...new Set(enrollments.map((e) => e.course?.categoryId).filter(Boolean))];

    let courses: Course[];
    if (enrolledCategoryIds.length > 0) {
      // Recommend from same categories
      courses = await this.courseRepo.find({
        where: {
          status: 'published' as any,
          categoryId: In(enrolledCategoryIds),
        },
        relations: ['teacher', 'category'],
        order: { rating: 'DESC', totalStudents: 'DESC' },
        take: 10,
      });
      // Filter out already enrolled
      courses = courses.filter((c) => !enrolledCourseIds.has(c.id));
    } else {
      // No enrolled courses, recommend popular ones
      courses = await this.courseRepo.find({
        where: { status: 'published' as any },
        relations: ['teacher', 'category'],
        order: { totalStudents: 'DESC', rating: 'DESC' },
        take: 10,
      });
    }

    if (courses.length === 0) {
      return { answer: 'Bạn đã đăng ký hết các khóa học trong danh mục yêu thích! Hãy thử khám phá danh mục mới.', data: [] };
    }

    const lines = courses.map((c, i) => {
      const price = Number(c.price) > 0 ? `${Number(c.price).toLocaleString('vi-VN')}đ` : 'Miễn phí';
      return `${i + 1}. **${c.title}** — ⭐ ${c.rating} | ${price} | ${c.category?.name ?? 'N/A'}`;
    });

    return {
      answer: `💡 Gợi ý khóa học dành cho bạn:\n\n${lines.join('\n')}`,
      data: courses.map((c) => ({
        id: c.id,
        title: c.title,
        rating: c.rating,
        price: c.price,
        category: c.category?.name ?? null,
      })),
    };
  }

  private async getMyProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      return { answer: 'Không tìm thấy thông tin tài khoản.', data: null };
    }

    const enrollments = await this.enrollmentRepo.count({ where: { userId } });
    const completed = await this.enrollmentRepo.count({ where: { userId, status: 'completed' as any } });

    const lines = [
      `👤 **${user.firstName ?? ''} ${user.lastName ?? ''}**`,
      `📧 Email: ${user.email}`,
      `🎭 Vai trò: ${user.role === 'student' ? 'Học viên' : user.role === 'teacher' ? 'Giảng viên' : 'Admin'}`,
      `📚 Đã đăng ký: ${enrollments} khóa học | Hoàn thành: ${completed}`,
    ];
    if (user.phone) lines.push(`📱 SĐT: ${user.phone}`);
    if (user.city) lines.push(`📍 Thành phố: ${user.city}`);

    return {
      answer: lines.join('\n'),
      data: {
        name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
        email: user.email,
        role: user.role,
        totalEnrolled: enrollments,
        totalCompleted: completed,
      },
    };
  }

  // ──────────────────── Helpers ────────────────────

  private getHelpText(): string {
    return `🤖 Mình là trợ lý học tập cá nhân, có thể giúp bạn:

📚 **Khóa học:**
  • "Khóa học của tôi" — Xem danh sách khóa đang học
  • "Tiến độ học tập" — Xem % hoàn thành từng khóa
  • "Tìm khóa học React" — Tìm khóa theo từ khóa
  • "Chi tiết khóa học ..." — Xem thông tin chi tiết
  • "Gợi ý khóa học" — Nhận đề xuất phù hợp

📝 **Bài tập & Kiểm tra:**
  • "Bài tập của tôi" — Xem tất cả bài tập
  • "Deadline sắp tới" — Xem các hạn nộp gần nhất
  • "Bài kiểm tra" — Xem danh sách quiz
  • "Điểm của tôi" — Xem bảng điểm

📅 **Lịch học:**
  • "Lịch học" / "Thời khóa biểu" — Xem lịch sắp tới

📂 **Khác:**
  • "Tài liệu" — Xem tài liệu học tập
  • "Danh mục" — Xem các lĩnh vực khóa học
  • "Thông tin của tôi" — Xem hồ sơ cá nhân

Hãy hỏi mình bất kỳ điều gì về việc học nhé! 💪`;
  }

  private getUnknownText(question: string): string {
    return `Xin lỗi, mình chưa hiểu câu hỏi "${question}" 😅

Hãy thử hỏi theo các mẫu sau:
• "Khóa học của tôi"
• "Bài tập / Deadline"
• "Lịch học / Thời khóa biểu"
• "Tìm khóa học [từ khóa]"
• "Điểm của tôi"
• "Gợi ý khóa học"

Hoặc gõ "giúp" để xem tất cả câu hỏi mình hỗ trợ!`;
  }

  private progressBar(percent: number): string {
    const filled = Math.round(percent / 10);
    return '█'.repeat(filled) + '░'.repeat(10 - filled);
  }
}
