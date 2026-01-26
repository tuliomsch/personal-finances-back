import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
import { CategoryType } from 'src/generated/prisma/enums';

export class CreateCategoryDto {
    @IsNotEmpty()
    @IsNumber()
    userId: number;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    icon: string;

    @IsNotEmpty()
    @IsString()
    type: CategoryType;

    @IsNumber()
    @IsOptional()
    parentId?: number;
}
