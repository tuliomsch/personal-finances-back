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

      if (data.type === TransactionType.TRANSFER && !data.transferToId) {
        throw new Error('Debe especificar la cuenta de destino para una transferencia.');
      }

      if (data.type === TransactionType.TRANSFER && data.transferToId === data.accountId) {
        throw new Error('No puedes transferir a la misma cuenta.');
      }

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

      await this.handleTransactionImpact(tx, newTransaction, 'APPLY');

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
        accountId: true,
        categoryId: true,
        transferToId: true,
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

  async update(id: number, updateTransactionDto: UpdateTransactionDto) {
    return await this.prisma.$transaction(async (tx) => {
      const oldTransaction = await tx.transaction.findUnique({
        where: { id, userId: updateTransactionDto.userId },
        include: { account: true },
      });

      if (!oldTransaction) {
        throw new Error('Transacción no encontrada');
      }

      await this.handleTransactionImpact(tx, oldTransaction, 'REVERT');

      const newAccId = updateTransactionDto.accountId ?? oldTransaction.accountId;
      const newAmount = updateTransactionDto.amount ?? oldTransaction.amount;
      const newType = (updateTransactionDto.type as TransactionType) ?? oldTransaction.type;
      const newTransferToId = updateTransactionDto.type === TransactionType.TRANSFER ? (updateTransactionDto.transferToId ?? oldTransaction.transferToId) : null;

      const transactionToApply = {
        accountId: newAccId,
        amount: newAmount,
        type: newType,
        transferToId: newTransferToId,
        userId: updateTransactionDto.userId
      };

      await this.handleTransactionImpact(tx, transactionToApply, 'APPLY');

      const dataToUpdate: any = { ...updateTransactionDto };
      if (updateTransactionDto.rawDescription) {
        dataToUpdate.description = updateTransactionDto.rawDescription;
      }

      return await tx.transaction.update({
        where: { id },
        data: dataToUpdate,
      });
    });
  }

  async remove(userId: number, id: number) {
    return await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id, userId },
        include: { account: true },
      });

      if (!transaction) {
        return null;
      }

      await this.handleTransactionImpact(tx, transaction, 'REVERT');

      return await tx.transaction.delete({
        where: { id, userId },
      });
    });
  }

  async handleTransactionImpact(tx: any, transaction: any, mode: 'APPLY' | 'REVERT') {
    const { accountId, amount, type, transferToId, userId } = transaction;
    const multiplier = mode === 'APPLY' ? 1 : -1;

    const account = await tx.account.findUnique({
      where: { id: accountId, userId },
      select: { type: true }
    });
    if (!account) throw new Error('Cuenta de origen no encontrada o no pertenece al usuario');

    const isCreditCard = account.type === 'CREDIT_CARD';
    const isExpense = type === TransactionType.EXPENSE;
    const isTransfer = type === TransactionType.TRANSFER;

    if (isCreditCard) {
      const movementAmount = isExpense || isTransfer ? amount : -amount;
      await tx.account.update({
        where: { id: accountId, userId },
        data: { cardDebt: { increment: movementAmount * multiplier } },
      });
    } else {
      const movementAmount = isExpense || isTransfer ? -amount : amount;

      await tx.account.update({
        where: { id: accountId, userId },
        data: { balance: { increment: movementAmount * multiplier } },
      });
    }

    if (isTransfer && transferToId) {
      const destAcc = await tx.account.findUnique({
        where: { id: transferToId, userId },
        select: { type: true }
      });
      if (!destAcc) throw new Error('Cuenta de destino no encontrada o no pertenece al usuario');

      if (destAcc.type === 'CREDIT_CARD') {
        await tx.account.update({
          where: { id: transferToId, userId },
          data: { cardDebt: { increment: -amount * multiplier } },
        });
      } else {
        await tx.account.update({
          where: { id: transferToId, userId },
          data: { balance: { increment: amount * multiplier } },
        });
      }
    }
  }
}
