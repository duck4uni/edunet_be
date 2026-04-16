import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatSettings } from './entities/chat-settings.entity';
import { SuccessResponse } from '../core/responses/base.responses';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    @InjectRepository(ChatSettings)
    private readonly settingsRepository: Repository<ChatSettings>,
  ) {}

  async saveMessage(
    senderId: string,
    receiverId: string,
    content: string,
    type: string = 'text',
  ): Promise<ChatMessage> {
    const message = this.messageRepository.create({
      senderId,
      receiverId,
      content,
      type,
    });
    return this.messageRepository.save(message);
  }

  async getMessages(userId: string, friendId: string, page = 1, limit = 50) {
    const [messages, total] = await this.messageRepository.findAndCount({
      where: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return new SuccessResponse({
      messages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  async markAsRead(userId: string, senderId: string) {
    await this.messageRepository.update(
      { senderId, receiverId: userId, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCounts(userId: string) {
    const counts = await this.messageRepository
      .createQueryBuilder('msg')
      .select('msg.senderId', 'senderId')
      .addSelect('COUNT(*)', 'count')
      .where('msg.receiverId = :userId', { userId })
      .andWhere('msg.isRead = false')
      .groupBy('msg.senderId')
      .getRawMany();

    return new SuccessResponse(counts);
  }

  async getLastMessages(userId: string) {
    // Get the last message for each conversation partner, with user info
    const lastMessages = await this.messageRepository
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.sender', 'sender')
      .leftJoinAndSelect('msg.receiver', 'receiver')
      .where(
        `msg.id IN (
          SELECT DISTINCT ON (partner_id) sub.id FROM (
            SELECT m.id, m."createdAt",
              CASE WHEN m."senderId" = :userId THEN m."receiverId" ELSE m."senderId" END AS partner_id
            FROM "ChatMessages" m
            WHERE m."senderId" = :userId OR m."receiverId" = :userId
          ) sub
          ORDER BY partner_id, sub."createdAt" DESC
        )`,
        { userId },
      )
      .getMany();

    // Transform to include partner info + settings
    const allSettings = await this.settingsRepository.find({
      where: { userId },
    });
    const settingsMap = new Map(
      allSettings.map((s) => [s.partnerId, s]),
    );

    const result = lastMessages
      .map((msg) => {
        const partner = msg.senderId === userId ? msg.receiver : msg.sender;
        const partnerId = partner?.id;
        const settings = partnerId ? settingsMap.get(partnerId) : null;

        // Skip hidden conversations (unless there's a new message after hiddenAt)
        if (settings?.isHidden && settings.hiddenAt) {
          const msgTime = new Date(msg.createdAt).getTime();
          const hiddenTime = new Date(settings.hiddenAt).getTime();
          if (msgTime <= hiddenTime) return null;
        }

        return {
          id: msg.id,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          content: msg.content,
          type: msg.type,
          isRead: msg.isRead,
          createdAt: msg.createdAt,
          isPinned: settings?.isPinned ?? false,
          partner: partner
            ? {
                id: partner.id,
                email: partner.email,
                firstName: partner.firstName,
                lastName: partner.lastName,
                avatar: partner.avatar,
                role: partner.role,
              }
            : null,
        };
      })
      .filter(Boolean);

    return new SuccessResponse(result);
  }

  private async getOrCreateSettings(
    userId: string,
    partnerId: string,
  ): Promise<ChatSettings> {
    let settings = await this.settingsRepository.findOne({
      where: { userId, partnerId },
    });
    if (!settings) {
      settings = this.settingsRepository.create({ userId, partnerId });
      settings = await this.settingsRepository.save(settings);
    }
    return settings;
  }

  async togglePin(userId: string, partnerId: string) {
    const settings = await this.getOrCreateSettings(userId, partnerId);
    settings.isPinned = !settings.isPinned;
    const saved = await this.settingsRepository.save(settings);
    return new SuccessResponse({ isPinned: saved.isPinned });
  }

  async hideConversation(userId: string, partnerId: string) {
    const settings = await this.getOrCreateSettings(userId, partnerId);
    settings.isHidden = true;
    settings.hiddenAt = new Date();
    await this.settingsRepository.save(settings);
    return new SuccessResponse(null);
  }

  async getSettings(userId: string) {
    const settings = await this.settingsRepository.find({
      where: { userId },
    });
    return new SuccessResponse(settings);
  }
}
