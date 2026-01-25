import { Injectable } from '@nestjs/common';
import { CreateManualTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PrismaService } from '../prisma/prisma.service';
import { generateTransactionHash } from 'src/common/utils/transaction-hash.util';
import { TransactionType } from 'src/generated/prisma/enums';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) { }

  async createManualTransaction(data: CreateManualTransactionDto) {
    return await this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: {
          id: data.accountId,
          userId: data.userId,
        },
      });

      if (!account) {
        throw new Error('La cuenta no existe o no pertenece al usuario.');
      }

      // Si es transferencia, validar cuenta destino
      if (data.type === TransactionType.TRANSFER && !data.transferToId) {
        throw new Error('Debe especificar la cuenta de destino para una transferencia.');
      }

      if (data.type === TransactionType.TRANSFER && data.transferToId === data.accountId) {
        throw new Error('No puedes transferir a la misma cuenta.');
      }

      let transferToAccount;
      if (data.type === TransactionType.TRANSFER && data.transferToId) {
        transferToAccount = await tx.account.findFirst({
          where: {
            id: data.transferToId,
            userId: data.userId // Asegurar que sea del mismo usuario (o permitir a otros si fuera el caso de uso)
          }
        });
        if (!transferToAccount) {
          throw new Error('La cuenta de destino no existe o no pertenece al usuario.');
        }
      }

      const isCreditCard = account.type === 'CREDIT_CARD';
      const isExpense = data.type === TransactionType.EXPENSE;
      const isTransfer = data.type === TransactionType.TRANSFER;

      const counter = await tx.transaction.count({
        where: {
          accountId: data.accountId,
          transactionDate: data.transactionDate,
          amount: data.amount,
          rawDescription: data.rawDescription,
        },
      });

      const hashInput = {
        date: data.transactionDate,
        amount: data.amount,
        rawDescription: data.rawDescription,
        accountId: data.accountId,
        counter,
      };

      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          description: data.rawDescription,
          transactionHash: generateTransactionHash(hashInput),
        },
      });

      if (isCreditCard && isExpense) {
        await tx.account.update({
          where: { id: data.accountId },
          data: {
            cardDebt: {
              increment: data.amount,
            },
          },
        });
      } else {
        const isExpenseOrTransfer = isExpense || isTransfer;
        const movementAmount = isExpenseOrTransfer ? -data.amount : data.amount;

        await tx.account.update({
          where: { id: data.accountId },
          data: {
            balance: {
              increment: movementAmount,
            },
          },
        });
      }

      if (isTransfer && data.transferToId) {
        if (transferToAccount.type === 'CREDIT_CARD') {
          await tx.account.update({
            where: { id: data.transferToId},
            data: {
              cardDebt: {
                decrement: data.amount
              }
            }
          })
        }
        else {   
          await tx.account.update({
            where: { id: data.transferToId },
            data: {
              balance: {
                increment: data.amount
              }
            }
          });
        }
      }

      return { transaction: newTransaction, account };
    });
  }

  async findAllByUser(userId: string, startDate?: string, endDate?: string) {
    const where: any = {
      userId: parseInt(userId),
    };

    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(startDate).toISOString(),
        lte: new Date(endDate).toISOString(),
      };
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      select: {
        id: true,
        description: true,
        amount: true,
        transactionDate: true,
        type: true,
        category: true,
      },
      orderBy: {
        transactionDate: 'desc',
      },
    });

    const totalIncome = transactions.filter((t) => t.type === TransactionType.INCOME).reduce((acc, t) => acc + Number(t.amount), 0);
    const totalExpense = transactions.filter((t) => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + Number(t.amount), 0);

    return { transactions, totalIncome, totalExpense };
  }

  findOne(id: number) {
    return `This action returns a #${id} transaction`;
  }

  update(id: number, updateTransactionDto: UpdateTransactionDto) {
    return `This action updates a #${id} transaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} transaction`;
  }
}
