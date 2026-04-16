import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendFriendRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class RespondFriendRequestDto {
  @IsNotEmpty()
  friendshipId: string;

  @IsNotEmpty()
  action: 'accept' | 'reject';
}
