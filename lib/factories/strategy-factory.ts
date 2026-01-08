import { GradingStrategy } from '../strategies/base';
import { MathGradingStrategy } from '../strategies/math';
import { EssayStrategy } from '../strategies/essay';
import { WholeExamStrategy } from '../strategies/whole-exam';

export enum GradingMode {
  MATH = 'math',
  ESSAY = 'essay',
  WHOLE_EXAM = 'whole_exam',
}

export class StrategyFactory {
  private strategies: Map<GradingMode, GradingStrategy>;

  constructor() {
    this.strategies = new Map();
    this.strategies.set(GradingMode.MATH, new MathGradingStrategy());
    this.strategies.set(GradingMode.ESSAY, new EssayStrategy());
    this.strategies.set(GradingMode.WHOLE_EXAM, new WholeExamStrategy());
  }

  getStrategy(mode: GradingMode): GradingStrategy {
    const strategy = this.strategies.get(mode);
    if (!strategy) {
      throw new Error(`No strategy found for mode: ${mode}`);
    }
    return strategy;
  }

  registerStrategy(mode: GradingMode, strategy: GradingStrategy): void {
    this.strategies.set(mode, strategy);
  }

  getAvailableModes(): GradingMode[] {
    return Array.from(this.strategies.keys());
  }
}

export const strategyFactory = new StrategyFactory();