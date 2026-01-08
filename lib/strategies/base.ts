import { ExamGradingResult } from '../services/gemini';

export interface GradingOptions {
  totalMaxScore?: number;
  subject?: string;
  essayPrompt?: string;
  rubric?: Record<string, unknown>;
}

export interface GradingStrategy {
  grade(images: File[], options?: GradingOptions): Promise<ExamGradingResult>;
  getStrategyName(): string;
}

export abstract class BaseGradingStrategy implements GradingStrategy {
  abstract grade(images: File[], options?: GradingOptions): Promise<ExamGradingResult>;
  abstract getStrategyName(): string;
}