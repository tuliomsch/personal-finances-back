import { PartialType } from '@nestjs/mapped-types';
import { CreateManualTransactionDto } from './create-transaction.dto';

export class UpdateTransactionDto extends PartialType(
  CreateManualTransactionDto,
) {}
