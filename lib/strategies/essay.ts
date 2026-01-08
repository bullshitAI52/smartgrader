import { geminiService, ExamGradingResult } from '../services/gemini';
import { BaseGradingStrategy, GradingOptions } from './base';

export class EssayStrategy extends BaseGradingStrategy {
  async grade(images: File[], _options?: GradingOptions): Promise<ExamGradingResult> {
    return geminiService.generateExamGrading(images, 100);
  }

  getStrategyName(): string {
    return 'EssayGrading';
  }

  async generateExamples(essayTopic: string): Promise<{
    creative: string;
    philosophical: string;
    analytical: string;
  }> {
    return geminiService.generateEssayExamples(essayTopic);
  }
}