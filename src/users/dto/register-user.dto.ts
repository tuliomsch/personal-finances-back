import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  supabaseId: string;

  @IsNotEmpty()
  @IsString()
  @Length(3, 3)
  currencyPref: string;

  @IsNotEmpty()
  accounts: {
    type: string;
    balance: number;
    name: string;
    bankName?: string;
  }[];
}
