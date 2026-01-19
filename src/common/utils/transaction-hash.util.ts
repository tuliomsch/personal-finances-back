import { createHash } from 'crypto';
import dayjs from 'dayjs';

interface HashInput {
  date: Date | string;
  amount: number | string;
  rawDescription: string;
  accountId: number;
}

export function generateTransactionHash(input: HashInput): string {
  const formattedDate = dayjs(input.date).format('YYYY-MM-DD');
  const formattedAmount = Number(input.amount).toFixed(2);
  const formattedDesc = input.rawDescription.trim().toLowerCase();
  const seed = `${formattedDate}_${formattedAmount}_${formattedDesc}_${input.accountId}`;

  return createHash('sha256').update(seed).digest('hex');
}
