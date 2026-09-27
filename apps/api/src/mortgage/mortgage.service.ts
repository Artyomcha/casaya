import { Injectable } from '@nestjs/common';

/** Базовая ставка партнёрских банков для нерезидентов (годовая). */
export const BASE_RATE = 0.032;

export interface MortgageInput {
  price: number;
  downPaymentPercent: number;
  termYears: number;
  rate?: number;
}

export interface MortgageResult {
  price: number;
  downPaymentPercent: number;
  downPayment: number;
  loan: number;
  termYears: number;
  rate: number;
  monthly: number;
  totalPaid: number;
  overpay: number;
}

@Injectable()
export class MortgageService {
  /** Аннуитетный платёж: L·r / (1 − (1+r)^−n). */
  calculate({ price, downPaymentPercent, termYears, rate = BASE_RATE }: MortgageInput): MortgageResult {
    const loan = price * (1 - downPaymentPercent / 100);
    const monthlyRate = rate / 12;
    const months = termYears * 12;
    const monthly = loan * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
    const totalPaid = monthly * months;

    return {
      price,
      downPaymentPercent,
      downPayment: Math.round(price * downPaymentPercent / 100),
      loan: Math.round(loan),
      termYears,
      rate,
      monthly: Math.round(monthly),
      totalPaid: Math.round(totalPaid),
      overpay: Math.round(totalPaid - loan),
    };
  }
}
