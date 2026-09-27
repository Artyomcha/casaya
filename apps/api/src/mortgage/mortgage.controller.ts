import { Body, Controller, Post } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { MortgageService } from './mortgage.service';

class MortgageDto {
  @Type(() => Number) @IsInt() @Min(20000) @Max(20000000)
  price: number;

  @Type(() => Number) @IsInt() @Min(0) @Max(95)
  downPaymentPercent: number;

  @Type(() => Number) @IsInt() @Min(1) @Max(40)
  termYears: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(1)
  rate?: number;
}

@Controller('mortgage')
export class MortgageController {
  constructor(private readonly mortgage: MortgageService) {}

  @Post('calculate')
  calculate(@Body() dto: MortgageDto) {
    return this.mortgage.calculate(dto);
  }
}
