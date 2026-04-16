import { Controller, Post, Body, Req, HttpStatus } from '@nestjs/common';
import { PersonalAssistantService } from './personal-assistant.service';
import { ExpressRequest } from '../core/types/express-request.interface';
import { ErrorResponse } from '../core/responses/base.responses';

@Controller('personal-assistant')
export class PersonalAssistantController {
  constructor(private readonly assistantService: PersonalAssistantService) {}

  @Post('ask')
  async ask(
    @Body('question') question: string,
    @Req() req: ExpressRequest,
  ) {
    if (!req.user) {
      return new ErrorResponse('Chưa đăng nhập', HttpStatus.UNAUTHORIZED);
    }
    if (!question || !question.trim()) {
      return new ErrorResponse('Vui lòng nhập câu hỏi', HttpStatus.BAD_REQUEST);
    }
    return this.assistantService.handleQuestion(req.user.id, question.trim());
  }
}
