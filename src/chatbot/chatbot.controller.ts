import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { CreateChatDataDto } from './dto/create-chat-data.dto';
import { UpdateChatDataDto } from './dto/update-chat-data.dto';
import { AskChatbotDto } from './dto/ask-chatbot.dto';
import { GenerateCourseContentDto } from './dto/generate-course-content.dto';
import {
  PaginationParams,
  SortingParams,
  FilteringParams,
  IncludeRelations,
  Pagination,
  Sorting,
  Filtering,
  Including,
} from 'src/core/decorators';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  /**
   * GET /api/chatbot
   * Lấy danh sách dữ liệu chatbot với phân trang, sắp xếp, lọc
   */
  @Get()
  findAll(
    @PaginationParams() pagination: Pagination,
    @SortingParams() sorts: Sorting[] | null,
    @FilteringParams() filters: Filtering[] | null,
    @IncludeRelations() includes: Including | null,
  ) {
    return this.chatbotService.findAll(pagination, sorts, filters, includes);
  }

  /**
   * POST /api/chatbot/ask
   * Hỏi đáp AI dựa trên dữ liệu chatbot
   * Không yêu cầu auth
   */
  @Post('ask')
  ask(@Body() askDto: AskChatbotDto) {
    return this.chatbotService.ask(askDto);
  }

  /**
   * POST /api/chatbot/generate-content
   * Sinh dữ liệu nội dung khóa học bằng Gemini (material/assignment)
   */
  @Post('generate-content')
  generateContent(@Body() generateDto: GenerateCourseContentDto) {
    return this.chatbotService.generateCourseContent(generateDto);
  }

  /**
   * POST /api/chatbot
   * Tạo dữ liệu chatbot mới
   */
  @Post()
  create(@Body() createChatDataDto: CreateChatDataDto) {
    return this.chatbotService.create(createChatDataDto);
  }

  /**
   * GET /api/chatbot/:id
   * Lấy một bản ghi chatbot theo id
   */
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.chatbotService.findOne(id);
  }

  /**
   * PATCH /api/chatbot/:id
   * Cập nhật dữ liệu chatbot
   */
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateChatDataDto: UpdateChatDataDto,
  ) {
    return this.chatbotService.update(id, updateChatDataDto);
  }

  /**
   * DELETE /api/chatbot/:id
   * Xóa dữ liệu chatbot (soft delete)
   */
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.chatbotService.remove(id);
  }
}
