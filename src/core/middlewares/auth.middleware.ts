import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { ExpressRequest } from '../types/express-request.interface';
import { JwtService } from '../services/jwt.service';
import { UserService } from 'src/user/user.service';
import { SuccessResponse } from '../responses/base.responses';
import { User } from '../../user/entities/user.entity';
import { omit } from '../utils';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async use(req: ExpressRequest, _: Response, next: NextFunction) {
    if (!req.headers.authorization) {
      req.user = null;
      next();
      return;
    }

    const token = req.headers.authorization.split(' ')[1];

    if (!token || token === 'null' || token === 'undefined') {
      req.user = null;
      next();
      return;
    }

    try {
      const decode = this.jwtService.decodeJwtToken(token) as JwtPayload;
      const res = await this.userService.findOne(decode.id as string);
      const user = (res as SuccessResponse)?.data as User;

      req.user = omit(user, 'password');
      next();
    } catch (err) {
      console.error('Error decoding JWT token:', err);
      req.user = null;
      next();
    }
  }
}
