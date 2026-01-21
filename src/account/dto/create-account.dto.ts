import { AccountType, BankName } from "../../generated/prisma/client";
import { IsNotEmpty, IsNumber, IsString, IsBoolean } from 'class-validator';

export class CreateAccountDto {
    @IsNotEmpty()
    @IsNumber()
    userId: number;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    type: AccountType;

    @IsNotEmpty()
    @IsNumber()
    balance: number;

    @IsNotEmpty()
    @IsString()
    currencyCode: string;

    @IsString()
    bankName?: BankName;
}
