import { geminiService, ExamGradingResult } from '../services/gemini';
import { BaseGradingStrategy, GradingOptions } from './base';

export class MathGradingStrategy extends BaseGradingStrategy {
  async grade(images: File[], options?: GradingOptions): Promise<ExamGradingResult> {
    const totalMaxScore = options?.totalMaxScore || 100;
    
    return geminiService.generateExamGrading(images, totalMaxScore);
  }

  getStrategyName(): string {
    return 'MathGrading';
  }
}