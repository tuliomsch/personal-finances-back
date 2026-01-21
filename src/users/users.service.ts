import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, AccountType, BankName } from '../generated/prisma/client';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async findUserBySupabaseId(supabaseId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        supabaseId: supabaseId,
      },
    });
  }

  async registerUser(createUserDto: RegisterUserDto): Promise<User> {
    const accountsToCreate = createUserDto.accounts.map((account) => {
      let type: AccountType;
      switch (account.type) {
        case 'Efectivo':
          type = AccountType.CASH;
          break;
        case 'Cuenta Corriente':
          type = AccountType.CHECKING;
          break;
        case 'Cuenta Vista/Rut':
          type = AccountType.DEPOSIT;
          break;
        case 'Tarjeta de Crédito':
          type = AccountType.CREDIT_CARD;
          break;
        case 'Cuenta de Ahorro':
          type = AccountType.SAVINGS;
          break;
        default:
          type = AccountType.CASH;
      }

      return {
        name: account.name,
        type: type, 
        balance: account.balance,
        currencyCode: createUserDto.currencyPref,
        bankName: account.bankName as BankName,
        cardDebt: account.cardDebt,
      };
    });

    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        lastName: createUserDto.lastName,
        supabaseId: createUserDto.supabaseId,
        currencyPref: createUserDto.currencyPref,
        accounts: {
          create: accountsToCreate,
        },
      },
    });
  }
}
