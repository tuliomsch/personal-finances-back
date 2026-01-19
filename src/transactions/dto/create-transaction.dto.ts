import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { TransactionType } from 'src/generated/prisma/enums';

export class CreateManualTransactionDto {
  @IsInt()
  accountId: number;

  @IsInt()
  categoryId: number;

  @IsInt()
  userId: number;

  @IsString()
  type: TransactionType;

  @IsNumber({ maxDecimalPlaces: 4 })
  amount: number;

  @IsDateString()
  transactionDate: string;

  @IsString()
  @IsOptional()
  rawDescription: string;

  @IsInt()
  @IsOptional()
  transferToId?: number;
}

