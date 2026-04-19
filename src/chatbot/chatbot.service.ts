import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull, Not } from 'typeorm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatData } from './entities/chat-data.entity';
import { CreateChatDataDto } from './dto/create-chat-data.dto';
import { UpdateChatDataDto } from './dto/update-chat-data.dto';
import { AskChatbotDto } from './dto/ask-chatbot.dto';
import {
  GenerateCourseContentDto,
  GenerateContentType,
} from './dto/generate-course-content.dto';
import { SuccessResponse, ErrorResponse } from 'src/core/responses/base.responses';
import { CommonResponse, PaginationResponseInterface } from 'src/core/types/response';
import { Pagination, Sorting, Filtering, Including } from 'src/core/decorators';
import { getWhere, getOrder, getRelations } from 'src/core/helpers';

type GeneratedMaterialSuggestion = {
  title: string;
  description: string;
  type: 'pdf' | 'video' | 'document' | 'link' | 'image';
  size: string;
  downloadUrl: string;
  isVisible: boolean;
};

type GeneratedAssignmentSuggestion = {
  title: string;
  description: string;
  dueDate: string;
  maxGrade: number;
  isVisible: boolean;
};

type GeneratedCourseContentSuggestion =
  | GeneratedMaterialSuggestion
  | GeneratedAssignmentSuggestion;

@Injectable()
export class ChatbotService {
  private geminiModel: any;

  constructor(
    @InjectRepository(ChatData)
    private readonly chatDataRepository: Repository<ChatData>,
  ) {
    this.initializeGemini();
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return typeof error === 'string' ? error : 'An unknown error occurred';
  }

  private parseJsonObject(rawText: string): Record<string, unknown> | null {
    const trimmed = rawText.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Continue with best-effort extraction from markdown/code block output.
    }

    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start < 0 || end < 0 || end <= start) {
      return null;
    }

    try {
      const parsed = JSON.parse(trimmed.slice(start, end + 1));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }

    return null;
  }

  private isValidHttpUrl(value: unknown): value is string {
    if (typeof value !== 'string' || !value.trim()) {
      return false;
    }

    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private normalizeMaterialSuggestion(
    payload: Record<string, unknown> | null,
    courseTitle: string,
  ): GeneratedMaterialSuggestion {
    const allowedTypes = ['pdf', 'video', 'document', 'link', 'image'];
    const typeRaw =
      typeof payload?.type === 'string' ? payload.type.toLowerCase().trim() : '';

    return {
      title:
        typeof payload?.title === 'string' && payload.title.trim().length > 0
          ? payload.title.trim()
          : `Tài liệu tổng quan - ${courseTitle}`,
      description:
        typeof payload?.description === 'string' &&
        payload.description.trim().length > 0
          ? payload.description.trim()
          : `Tài liệu tham khảo dành cho khóa học ${courseTitle}.`,
      type: allowedTypes.includes(typeRaw)
        ? (typeRaw as GeneratedMaterialSuggestion['type'])
        : 'document',
      size:
        typeof payload?.size === 'string' && payload.size.trim().length > 0
          ? payload.size.trim()
          : '1.2MB',
      downloadUrl: this.isValidHttpUrl(payload?.downloadUrl)
        ? payload.downloadUrl
        : 'https://example.com/tai-lieu-khoa-hoc',
      isVisible: typeof payload?.isVisible === 'boolean' ? payload.isVisible : true,
    };
  }

  private normalizeAssignmentSuggestion(
    payload: Record<string, unknown> | null,
    courseTitle: string,
  ): GeneratedAssignmentSuggestion {
    const dueDateCandidate =
      typeof payload?.dueDate === 'string' ? payload.dueDate : '';
    const parsedDueDate = new Date(dueDateCandidate);

    const dueDate = Number.isNaN(parsedDueDate.getTime())
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : parsedDueDate.toISOString();

    const maxGradeRaw =
      typeof payload?.maxGrade === 'number'
        ? payload.maxGrade
        : Number(payload?.maxGrade);

    return {
      title:
        typeof payload?.title === 'string' && payload.title.trim().length > 0
          ? payload.title.trim()
          : `Bài tập ứng dụng - ${courseTitle}`,
      description:
        typeof payload?.description === 'string' &&
        payload.description.trim().length > 0
          ? payload.description.trim()
          : `Thực hành kiến thức trọng tâm trong khóa học ${courseTitle}.`,
      dueDate,
      maxGrade:
        Number.isFinite(maxGradeRaw) && maxGradeRaw > 0
          ? Math.round(maxGradeRaw)
          : 100,
      isVisible: typeof payload?.isVisible === 'boolean' ? payload.isVisible : true,
    };
  }

  private initializeGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found in environment');
      return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    this.geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async findAll(
    pagination: Pagination,
    sorts: Sorting[] | null,
    filters: Filtering[] | null,
    includes: Including | null,
  ): Promise<CommonResponse<PaginationResponseInterface<ChatData>>> {
    try {
      const where = filters ? getWhere(filters) : { deletedAt: IsNull() };
      // Ensure soft-deleted records are not returned
      where.deletedAt = IsNull();

      const order = sorts ? getOrder(sorts) : { createdAt: 'DESC' };
      const relations = includes ? getRelations(includes) : [];

      const [rows, count] = await this.chatDataRepository.findAndCount({
        where,
        order,
        relations,
        skip: pagination.offset,
        take: pagination.limit,
      });

      return new SuccessResponse({ rows, count });
    } catch (error) {
      return new ErrorResponse(this.getErrorMessage(error), HttpStatus.BAD_REQUEST);
    }
  }

  async create(
    createChatDataDto: CreateChatDataDto,
  ): Promise<CommonResponse<ChatData>> {
    try {
      const { title, content, fileType, htmlContent, imageCount, date } =
        createChatDataDto;

      if (!title || !content) {
        return new ErrorResponse(
          'Title and content are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const chatData = this.chatDataRepository.create({
        title,
        content,
        fileType: fileType || 'text',
        htmlContent: htmlContent || null,
        imageCount: imageCount || 0,
        date:
          date ||
          new Date().toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
      });

      const saved = await this.chatDataRepository.save(chatData);
      return new SuccessResponse(saved, HttpStatus.CREATED);
    } catch (error) {
      return new ErrorResponse(this.getErrorMessage(error), HttpStatus.BAD_REQUEST);
    }
  }

  async findOne(id: string): Promise<CommonResponse<ChatData>> {
    try {
      const chatData = await this.chatDataRepository.findOne({
        where: { id, deletedAt: IsNull() },
      });

      if (!chatData) {
        return new ErrorResponse('Chat data not found', HttpStatus.NOT_FOUND);
      }

      return new SuccessResponse(chatData);
    } catch (error) {
      return new ErrorResponse(this.getErrorMessage(error), HttpStatus.BAD_REQUEST);
    }
  }

  async update(
    id: string,
    updateChatDataDto: UpdateChatDataDto,
  ): Promise<CommonResponse<ChatData>> {
    try {
      const chatData = await this.chatDataRepository.findOne({
        where: { id, deletedAt: IsNull() },
      });

      if (!chatData) {
        return new ErrorResponse('Chat data not found', HttpStatus.NOT_FOUND);
      }

      Object.assign(chatData, updateChatDataDto);
      const updated = await this.chatDataRepository.save(chatData);

      return new SuccessResponse(updated);
    } catch (error) {
      return new ErrorResponse(this.getErrorMessage(error), HttpStatus.BAD_REQUEST);
    }
  }

  async remove(id: string): Promise<CommonResponse<{ message: string }>> {
    try {
      const chatData = await this.chatDataRepository.findOne({
        where: { id, deletedAt: IsNull() },
      });

      if (!chatData) {
        return new ErrorResponse('Chat data not found', HttpStatus.NOT_FOUND);
      }

      await this.chatDataRepository.softDelete(id);
      return new SuccessResponse({ message: 'Chat data deleted successfully' });
    } catch (error) {
      return new ErrorResponse(this.getErrorMessage(error), HttpStatus.BAD_REQUEST);
    }
  }

  async ask(askDto: AskChatbotDto): Promise<
    CommonResponse<{
      answer: string;
      references: ChatData[];
    }>
  > {
    try {
      if (!this.geminiModel) {
        return new ErrorResponse(
          'Gemini API not configured',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const { question } = askDto;
      if (!question || question.trim().length === 0) {
        return new ErrorResponse(
          'Question is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Search for relevant data using ILIKE
      const escapedQuestion = question.replace(/[%_\\]/g, '\\$&');
      let relevantData = await this.chatDataRepository.find({
        where: [
          { title: Like(`%${escapedQuestion}%`), deletedAt: IsNull() },
          { content: Like(`%${escapedQuestion}%`), deletedAt: IsNull() },
        ],
        order: { createdAt: 'DESC' },
        take: 6,
      });

      // Fallback to latest data if no results found
      if (relevantData.length === 0) {
        relevantData = await this.chatDataRepository.find({
          where: { deletedAt: IsNull() },
          order: { createdAt: 'DESC' },
          take: 3,
        });
      }

      // Build context from relevant data
      const context = relevantData
        .map((item, index) => {
          const fileTypeInfo =
            item.fileType && item.fileType !== 'text'
              ? ` (loại: ${item.fileType})`
              : '';
          return `[${index + 1}] ${item.title}${fileTypeInfo}\n${item.content}`;
        })
        .join('\n\n');

      // Build prompt
      const prompt = [
        'Bạn là trợ lý AI hỗ trợ hỏi đáp của hệ thống EduNet.',
        'Luôn trả lời bằng tiếng Việt, chỉ sử dụng thông tin trong dữ liệu được cung cấp.',
        'Nếu dữ liệu không đủ, hãy nói rõ và gợi ý người dùng liên hệ hỗ trợ.',
        '',
        'Dữ liệu:',
        context || 'Không có dữ liệu',
        '',
        `Câu hỏi: ${question}`,
        '',
        'Câu trả lời:',
      ].join('\n');

      // Call Gemini API
      const result = await this.geminiModel.generateContent(prompt);
      const answer =
        result && result.response && typeof result.response.text === 'function'
          ? result.response.text()
          : '';

      return new SuccessResponse({
        answer:
          answer && answer.trim().length > 0
            ? answer.trim()
            : 'Tôi chưa tìm thấy thông tin phù hợp trong dữ liệu hiện có.',
        references: relevantData,
      });
    } catch (error) {
      console.error('Chatbot ask error:', error);
      return new ErrorResponse(
        this.getErrorMessage(error) || 'Lỗi xử lý câu hỏi. Vui lòng thử lại.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateCourseContent(
    generateDto: GenerateCourseContentDto,
  ): Promise<CommonResponse<{ suggestion: GeneratedCourseContentSuggestion }>> {
    try {
      if (!this.geminiModel) {
        return new ErrorResponse(
          'Gemini API not configured',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      const { contentType, courseTitle, courseDescription, requirement } = generateDto;
      const safeCourseTitle = courseTitle.trim();
      const safeCourseDescription = courseDescription?.trim() || 'Không có mô tả';
      const safeRequirement = requirement?.trim() || 'Không có yêu cầu bổ sung';

      const outputSchema =
        contentType === GenerateContentType.MATERIAL
          ? [
              '{',
              '  "title": "string",',
              '  "description": "string",',
              '  "type": "pdf | video | document | link | image",',
              '  "size": "string",',
              '  "downloadUrl": "https://...",',
              '  "isVisible": true',
              '}',
            ].join('\n')
          : [
              '{',
              '  "title": "string",',
              '  "description": "string",',
              '  "dueDate": "ISO datetime",',
              '  "maxGrade": 100,',
              '  "isVisible": true',
              '}',
            ].join('\n');

      const prompt = [
        'Bạn là trợ lý AI tạo dữ liệu mẫu cho hệ thống quản lý khóa học EduNet.',
        'Hãy trả về CHÍNH XÁC một JSON object hợp lệ, không thêm markdown/code fence, không giải thích.',
        'Nội dung phải rõ ràng, ngắn gọn, tiếng Việt, phù hợp với giáo dục trực tuyến.',
        '',
        `Loại nội dung: ${contentType}`,
        `Tên khóa học: ${safeCourseTitle}`,
        `Mô tả khóa học: ${safeCourseDescription}`,
        `Yêu cầu thêm từ giảng viên: ${safeRequirement}`,
        '',
        'Schema JSON bắt buộc:',
        outputSchema,
      ].join('\n');

      const result = await this.geminiModel.generateContent(prompt);
      const rawText =
        result && result.response && typeof result.response.text === 'function'
          ? result.response.text()
          : '';

      const parsedPayload = this.parseJsonObject(rawText);

      const suggestion =
        contentType === GenerateContentType.MATERIAL
          ? this.normalizeMaterialSuggestion(parsedPayload, safeCourseTitle)
          : this.normalizeAssignmentSuggestion(parsedPayload, safeCourseTitle);

      return new SuccessResponse({ suggestion });
    } catch (error) {
      console.error('Chatbot generateCourseContent error:', error);
      return new ErrorResponse(
        this.getErrorMessage(error) ||
          'Không thể sinh nội dung khóa học bằng AI. Vui lòng thử lại.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
