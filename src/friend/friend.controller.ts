import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Query,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { SendFriendRequestDto, RespondFriendRequestDto } from './dto/friend.dto';
import { ExpressRequest } from '../core/types/express-request.interface';
import { ErrorResponse } from '../core/responses/base.responses';

@Controller('friends')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Get('search')
  async searchByEmail(
    @Query('email') email: string,
    @Req() req: ExpressRequest,
  ) {
    if (!req.user) {
      return new ErrorResponse('Chưa đăng nhập', HttpStatus.UNAUTHORIZED);
    }
    return this.friendService.searchByEmail(email, req.user.id);
  }

  @Get()
  async getFriends(@Req() req: ExpressRequest) {
    if (!req.user) {
      return new ErrorResponse('Chưa đăng nhập', HttpStatus.UNAUTHORIZED);
    }
    return this.friendService.getFriends(req.user.id);
  }

  @Get('pending')
  async getPendingRequests(@Req() req: ExpressRequest) {
    if (!req.user) {
      return new ErrorResponse('Chưa đăng nhập', HttpStatus.UNAUTHORIZED);
    }
    return this.friendService.getPendingRequests(req.user.id);
  }

  @Get('sent')
  async getSentRequests(@Req() req: ExpressRequest) {
    if (!req.user) {
      return new ErrorResponse('Chưa đăng nhập', HttpStatus.UNAUTHORIZED);
    }
    return this.friendService.getSentRequests(req.user.id);
  }

  @Post('request')
  async sendFriendRequest(
    @Body() dto: SendFriendRequestDto,
    @Req() req: ExpressRequest,
  ) {
    if (!req.user) {
      return new ErrorResponse('Chưa đăng nhập', HttpStatus.UNAUTHORIZED);
    }
    return this.friendService.sendRequest(req.user.id, dto.email);
  }

  @Post('respond')
  async respondToRequest(
    @Body() dto: RespondFriendRequestDto,
    @Req() req: ExpressRequest,
  ) {
    if (!req.user) {
      return new ErrorResponse('Chưa đăng nhập', HttpStatus.UNAUTHORIZED);
    }
    return this.friendService.respondToRequest(
      req.user.id,
      dto.friendshipId,
      dto.action,
    );
  }

  @Delete(':friendId')
  async unfriend(
    @Param('friendId') friendId: string,
    @Req() req: ExpressRequest,
  ) {
    if (!req.user) {
      return new ErrorResponse('Chưa đăng nhập', HttpStatus.UNAUTHORIZED);
    }
    return this.friendService.unfriend(req.user.id, friendId);
  }
}
