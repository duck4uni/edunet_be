import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friendship, FriendshipStatus } from './entities/friendship.entity';
import { User } from '../user/entities/user.entity';
import {
  SuccessResponse,
  ErrorResponse,
} from '../core/responses/base.responses';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly chatGateway: ChatGateway,
  ) {}

  async searchByEmail(email: string, currentUserId: string) {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email ILIKE :email', { email: `%${email}%` })
      .andWhere('user.id != :currentUserId', { currentUserId })
      .andWhere('user.isActive = true')
      .select([
        'user.id',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.avatar',
        'user.role',
      ])
      .take(20)
      .getMany();

    // Attach friendship status for each user
    const results = await Promise.all(
      users.map(async (user) => {
        const friendship = await this.friendshipRepository.findOne({
          where: [
            { requesterId: currentUserId, receiverId: user.id },
            { requesterId: user.id, receiverId: currentUserId },
          ],
        });

        return {
          ...user,
          friendshipStatus: friendship?.status || null,
          friendshipId: friendship?.id || null,
        };
      }),
    );

    return new SuccessResponse(results);
  }

  async sendRequest(currentUserId: string, receiverEmail: string) {
    const receiver = await this.userRepository.findOne({
      where: { email: receiverEmail, isActive: true },
    });

    if (!receiver) {
      return new ErrorResponse('Không tìm thấy người dùng', HttpStatus.NOT_FOUND);
    }

    if (receiver.id === currentUserId) {
      return new ErrorResponse('Không thể kết bạn với chính mình', HttpStatus.BAD_REQUEST);
    }

    const existing = await this.friendshipRepository.findOne({
      where: [
        { requesterId: currentUserId, receiverId: receiver.id },
        { requesterId: receiver.id, receiverId: currentUserId },
      ],
    });

    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        return new ErrorResponse('Đã là bạn bè', HttpStatus.CONFLICT);
      }
      if (existing.status === FriendshipStatus.PENDING) {
        return new ErrorResponse('Lời mời kết bạn đã được gửi', HttpStatus.CONFLICT);
      }
      // If rejected, allow re-sending by updating the existing record
      if (existing.status === FriendshipStatus.REJECTED) {
        existing.requesterId = currentUserId;
        existing.receiverId = receiver.id;
        existing.status = FriendshipStatus.PENDING;
        const saved = await this.friendshipRepository.save(existing);

        const requester = await this.userRepository.findOne({ where: { id: currentUserId } });
        if (requester) {
          this.chatGateway.notifyFriendRequest(receiver.id, {
            friendshipId: saved.id,
            id: requester.id,
            email: requester.email,
            firstName: requester.firstName,
            lastName: requester.lastName,
            avatar: requester.avatar,
          });
        }
        return new SuccessResponse(saved);
      }
    }

    const friendship = this.friendshipRepository.create({
      requesterId: currentUserId,
      receiverId: receiver.id,
      status: FriendshipStatus.PENDING,
    });

    const saved = await this.friendshipRepository.save(friendship);

    // Notify receiver via socket
    const requester = await this.userRepository.findOne({ where: { id: currentUserId } });
    if (requester) {
      this.chatGateway.notifyFriendRequest(receiver.id, {
        friendshipId: saved.id,
        id: requester.id,
        email: requester.email,
        firstName: requester.firstName,
        lastName: requester.lastName,
        avatar: requester.avatar,
      });
    }

    return new SuccessResponse(saved);
  }

  async respondToRequest(
    currentUserId: string,
    friendshipId: string,
    action: 'accept' | 'reject',
  ) {
    const friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId, receiverId: currentUserId },
    });

    if (!friendship) {
      return new ErrorResponse('Không tìm thấy lời mời kết bạn', HttpStatus.NOT_FOUND);
    }

    if (friendship.status !== FriendshipStatus.PENDING) {
      return new ErrorResponse('Lời mời đã được xử lý', HttpStatus.BAD_REQUEST);
    }

    friendship.status =
      action === 'accept'
        ? FriendshipStatus.ACCEPTED
        : FriendshipStatus.REJECTED;

    const saved = await this.friendshipRepository.save(friendship);

    // Notify requester via socket when accepted
    if (action === 'accept') {
      const accepter = await this.userRepository.findOne({ where: { id: currentUserId } });
      if (accepter) {
        this.chatGateway.notifyFriendAccepted(friendship.requesterId, {
          friendshipId: saved.id,
          id: accepter.id,
          email: accepter.email,
          firstName: accepter.firstName,
          lastName: accepter.lastName,
          avatar: accepter.avatar,
        });
      }
    }

    return new SuccessResponse(saved);
  }

  async getFriends(currentUserId: string) {
    const friendships = await this.friendshipRepository.find({
      where: [
        { requesterId: currentUserId, status: FriendshipStatus.ACCEPTED },
        { receiverId: currentUserId, status: FriendshipStatus.ACCEPTED },
      ],
      relations: ['requester', 'receiver'],
      order: { updatedAt: 'DESC' },
    });

    const friends = friendships.map((f) => {
      const friend =
        f.requesterId === currentUserId ? f.receiver : f.requester;
      return {
        id: friend.id,
        email: friend.email,
        firstName: friend.firstName,
        lastName: friend.lastName,
        avatar: friend.avatar,
        role: friend.role,
        friendshipId: f.id,
      };
    });

    return new SuccessResponse(friends);
  }

  async getPendingRequests(currentUserId: string) {
    const requests = await this.friendshipRepository.find({
      where: { receiverId: currentUserId, status: FriendshipStatus.PENDING },
      relations: ['requester'],
      order: { createdAt: 'DESC' },
    });

    const pending = requests.map((r) => ({
      friendshipId: r.id,
      id: r.requester.id,
      email: r.requester.email,
      firstName: r.requester.firstName,
      lastName: r.requester.lastName,
      avatar: r.requester.avatar,
      role: r.requester.role,
      createdAt: r.createdAt,
    }));

    return new SuccessResponse(pending);
  }

  async getSentRequests(currentUserId: string) {
    const requests = await this.friendshipRepository.find({
      where: { requesterId: currentUserId, status: FriendshipStatus.PENDING },
      relations: ['receiver'],
      order: { createdAt: 'DESC' },
    });

    const sent = requests.map((r) => ({
      friendshipId: r.id,
      id: r.receiver.id,
      email: r.receiver.email,
      firstName: r.receiver.firstName,
      lastName: r.receiver.lastName,
      avatar: r.receiver.avatar,
      role: r.receiver.role,
      createdAt: r.createdAt,
    }));

    return new SuccessResponse(sent);
  }

  async unfriend(currentUserId: string, friendId: string) {
    const friendship = await this.friendshipRepository.findOne({
      where: [
        {
          requesterId: currentUserId,
          receiverId: friendId,
          status: FriendshipStatus.ACCEPTED,
        },
        {
          requesterId: friendId,
          receiverId: currentUserId,
          status: FriendshipStatus.ACCEPTED,
        },
      ],
    });

    if (!friendship) {
      return new ErrorResponse('Không tìm thấy quan hệ bạn bè', HttpStatus.NOT_FOUND);
    }

    await this.friendshipRepository.remove(friendship);
    return new SuccessResponse(null);
  }
}
