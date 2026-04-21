import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ExpressRequest } from '../core/types/express-request.interface';
import { ErrorResponse, SuccessResponse } from '../core/responses/base.responses';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatGateway } from './chat.gateway';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post('messages')
  async sendMessage(@Body() body: SendMessageDto, @Req() req: ExpressRequest) {
    if (!req.user) {
      return new ErrorResponse('Chưa đăng nhập', HttpStatus.UNAUTHORIZED);
    }

    const message = await this.chatService.saveMessage(
      req.user.id,
      body.receiverId,
      body.content,
      body.type || 'text',
    );

    this.chatGateway.emitPersistedMessage({
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      type: message.type,
      createdAt: message.createdAt,
      isRead: message.isRead,
    });

    return new SuccessResponse({
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      type: message.type,
      createdAt: message.createdAt,
      isRead: message.isRead,
    });
  }

  @Get('messages/:friendId')
  async getMessages(
    @Param('friendId') friendId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Req() req: ExpressRequest,
  ) {
    if (!req.user) {
      return new ErrorResponse('Chưa đăng nhập', HttpStatus.UNAUTHORIZED);
    }
    return this.chatService.getMessages(
      req.user.id,
      friendId,
      parseInt(page) || 1,
      parseInt(limit) || 50,
    );
  }

  @Post('read/:senderId')
  async markAsRead(
    @Param('senderId') senderId: string,
    @Req() req: ExpressRequest,
  ) {
    if (!req.user) {
      return new ErrorResponse('Chưa đăng nhập', HttpStatus.UNAUTHORIZED);
    }
    await this.chatService.markAsRead(req.user.id, senderId);
    return { success: true };
  }

  @Get('unread')
  async getUnreadCounts(@Req() req: ExpressRequest) {
    if (!req.user) {
      return new ErrorResponse('Chưa đăng nhập', HttpStatus.UNAUTHORIZED);
    }
    return this.chatService.getUnreadCounts(req.user.id);
  }

  @Get('last-messages')
  async getLastMessages(@Req() req: ExpressRequest) {
    if (!req.user) {
      return new ErrorResponse('Chưa đăng nhập', HttpStatus.UNAUTHORIZED);
    }
    return this.chatService.getLastMessages(req.user.id);
  }

  @Post('pin/:partnerId')
  async togglePin(
    @Param('partnerId') partnerId: string,
    @Req() req: ExpressRequest,
  ) {
    if (!req.user) {
      return new ErrorResponse('Chưa đăng nhập', HttpStatus.UNAUTHORIZED);
    }
    return this.chatService.togglePin(req.user.id, partnerId);
  }

  @Delete('conversation/:partnerId')
  async hideConversation(
    @Param('partnerId') partnerId: string,
    @Req() req: ExpressRequest,
  ) {
    if (!req.user) {
      return new ErrorResponse('Chưa đăng nhập', HttpStatus.UNAUTHORIZED);
    }
    return this.chatService.hideConversation(req.user.id, partnerId);
  }
}
