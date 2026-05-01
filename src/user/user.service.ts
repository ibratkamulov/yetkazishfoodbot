import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async findOrCreateFromTelegram(payload: {
    telegramId: number;
    name: string;
    username?: string;
  }): Promise<User> {
    return this.userRepo.upsertByTelegramId(
      BigInt(payload.telegramId),
      { name: payload.name, username: payload.username },
      { username: payload.username },
    );
  }

  setPhone(userId: string, phone: string): Promise<User> {
    return this.userRepo.update(userId, { phone });
  }

  setLocation(
    userId: string,
    latitude: number,
    longitude: number,
    address?: string,
  ): Promise<User> {
    return this.userRepo.update(userId, { latitude, longitude, address });
  }

  isRegistered(user: User): boolean {
    return Boolean(user.phone && user.latitude !== null && user.longitude !== null);
  }

  findById(id: string) {
    return this.userRepo.findById(id);
  }

  findByTelegramId(telegramId: number) {
    return this.userRepo.findByTelegramId(BigInt(telegramId));
  }

  count() {
    return this.userRepo.countAll();
  }
}
