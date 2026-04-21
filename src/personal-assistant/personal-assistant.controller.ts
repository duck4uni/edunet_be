import {
  Controller,
  Post,
  Body,
  Req,
  HttpStatus,
  Get,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ManagedIntent, PersonalAssistantService } from './personal-assistant.service';
import { ExpressRequest } from '../core/types/express-request.interface';
import { ErrorResponse } from '../core/responses/base.responses';
import { AuthGuard } from '../core/guards/auth.guard';

@Controller('personal-assistant')
@UseGuards(AuthGuard)
export class PersonalAssistantController {
  constructor(private readonly assistantService: PersonalAssistantService) {}

  private ensureAdmin(req: ExpressRequest) {
    if (!req.user || req.user.role !== 'admin') {
      return new ErrorResponse('Bạn không có quyền truy cập chức năng quản trị', HttpStatus.FORBIDDEN);
    }
    return null;
  }

  @Get('quick-actions')
  getQuickActions() {
    return this.assistantService.getPublicQuickActions();
  }

  @Get('admin/intents')
  getAdminIntents(@Req() req: ExpressRequest) {
    const denied = this.ensureAdmin(req);
    if (denied) return denied;
    return this.assistantService.getAdminIntentConfigs();
  }

  @Patch('admin/intents/:intent')
  updateAdminIntent(
    @Param('intent') intent: string,
    @Body() payload: { enabled?: boolean; description?: string; examples?: string[] },
    @Req() req: ExpressRequest,
  ) {
    const denied = this.ensureAdmin(req);
    if (denied) return denied;

    return this.assistantService.updateAdminIntentConfig(intent as ManagedIntent, payload);
  }

  @Get('admin/quick-actions')
  getAdminQuickActions(@Req() req: ExpressRequest) {
    const denied = this.ensureAdmin(req);
    if (denied) return denied;
    return this.assistantService.getAdminQuickActions();
  }

  @Post('admin/quick-actions')
  createAdminQuickAction(
    @Body() payload: { label: string; question: string; icon: string; enabled?: boolean; order?: number },
    @Req() req: ExpressRequest,
  ) {
    const denied = this.ensureAdmin(req);
    if (denied) return denied;
    return this.assistantService.createAdminQuickAction(payload);
  }

  @Patch('admin/quick-actions/:id')
  updateAdminQuickAction(
    @Param('id') id: string,
    @Body() payload: { label?: string; question?: string; icon?: string; enabled?: boolean; order?: number },
    @Req() req: ExpressRequest,
  ) {
    const denied = this.ensureAdmin(req);
    if (denied) return denied;
    return this.assistantService.updateAdminQuickAction(id, payload);
  }

  @Delete('admin/quick-actions/:id')
  deleteAdminQuickAction(
    @Param('id') id: string,
    @Req() req: ExpressRequest,
  ) {
    const denied = this.ensureAdmin(req);
    if (denied) return denied;
    return this.assistantService.deleteAdminQuickAction(id);
  }

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
