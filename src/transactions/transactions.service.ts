import { Injectable } from '@nestjs/common';
import { CreateManualTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PrismaService } from '../prisma/prisma.service';
import { generateTransactionHash } from 'src/common/utils/transaction-hash.util';
import { TransactionType } from 'src/generated/prisma/enums';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) { }

  async createTransaction(data: CreateManualTransactionDto) {
    const hashInput = {
      date: data.transactionDate,
      amount: data.amount,
      rawDescription: data.rawDescription,
      accountId: data.accountId,
    };
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

      // Determinar monto del movimiento para la cuenta origen
      // EXPENSE o TRANSFER => Resta
      // INCOME => Suma
      const isExpenseOrTransfer = data.type === TransactionType.EXPENSE || data.type === TransactionType.TRANSFER;
      const movementAmount = isExpenseOrTransfer ? -data.amount : data.amount;

      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          description: data.rawDescription,
          transactionHash: generateTransactionHash(hashInput),
        },
      });

      const updatedAccount = await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: movementAmount,
          },
        },
      });

      // Si es transferencia, actualizar cuenta destino (sumar)
      if (data.type === TransactionType.TRANSFER && data.transferToId) {
        await tx.account.update({
          where: { id: data.transferToId },
          data: {
            balance: {
              increment: data.amount
            }
          }
        });
      }

      return { transaction: newTransaction, account: updatedAccount };
    });
  }

  async findAllByUser(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId: parseInt(userId),
      },
      select: {
        id: true,
        description: true,
        amount: true,
        transactionDate: true,
        type: true,
        category: true,
      }
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
