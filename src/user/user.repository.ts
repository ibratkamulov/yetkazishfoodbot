import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByTelegramId(telegramId: bigint): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { telegramId } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  upsertByTelegramId(
    telegramId: bigint,
    create: Omit<Prisma.UserCreateInput, 'telegramId'>,
    update: Prisma.UserUpdateInput = {},
  ): Promise<User> {
    return this.prisma.user.upsert({
      where: { telegramId },
      create: { ...create, telegramId },
      update,
    });
  }

  countAll(): Promise<number> {
    return this.prisma.user.count();
  }
}
