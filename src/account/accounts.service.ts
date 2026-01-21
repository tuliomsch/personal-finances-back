import { Injectable } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) { }

  create(createAccountDto: CreateAccountDto) {
    return this.prisma.account.create({
      data: {
        ...createAccountDto,
      },
    });
  }

  async findAllAccountsByUserId(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: {
        userId: parseInt(userId),
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
        currencyCode: true,
        bankName: true,
      },
    });
    const totalBalance = accounts.reduce((acc, account) => {
      if (account.type == 'CREDIT_CARD') {
        return acc;
      }
      return acc + Number(account.balance);
    }, 0);
    return { accounts, totalBalance };
  }

  findOne(id: number) {
    return this.prisma.account.findUnique({
      where: {
        id,
      },
    });
  }

  update(id: number, updateAccountDto: UpdateAccountDto) {
    return this.prisma.account.update({
      where: {
        id,
      },
      data: {
        ...updateAccountDto,
      },
    });
  }

  remove(id: number) {
    return this.prisma.account.update({
      where: {
        id,
      },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }
}
