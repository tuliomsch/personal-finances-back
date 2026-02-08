import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateManualTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller({
  path: 'transactions',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @Post()
  create(@Body() createManualTransactionDto: CreateManualTransactionDto) {
    return this.transactionsService.createManualTransaction(
      createManualTransactionDto,
    );
  }

  @Get('user/:userId')
  findAllByUser(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.transactionsService.findAllByUser(
      userId,
      startDate,
      endDate,
    );
  }

  @Get('user/:userId/analytics/summary')
  getExpenseAnalyticsSummary(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    return this.transactionsService.getExpenseAnalyticsSummary(
      userId,
      startDate,
      endDate,
      limit ? parseInt(limit) : 3,
    );
  }

  @Get('user/:userId/analytics/distribution')
  getCategoryDistribution(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.transactionsService.getCategoryDistribution(
      userId,
      startDate,
      endDate,
    );
  }

  @Get('user/:userId/analytics/comparison')
  getMonthlyComparison(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('prevStartDate') prevStartDate?: string,
    @Query('prevEndDate') prevEndDate?: string,
  ) {
    return this.transactionsService.getMonthlyComparison(
      userId,
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    return this.transactionsService.update(+id, updateTransactionDto);
  }

  @Delete('user/:userId/:id')
  remove(@Param('userId') userId: string, @Param('id') id: string) {
    return this.transactionsService.remove(+userId, +id);
  }
}
