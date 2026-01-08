'use server';

import { geminiService } from '@/lib/services/gemini';

export async function gradeExam(formData: FormData) {
  try {
    const images = formData.getAll('images') as File[];
    const totalMaxScore = Number(formData.get('totalMaxScore')) || 100;

    if (images.length === 0) {
      throw new Error('No images provided');
    }

    const result = await geminiService.generateExamGrading(images, totalMaxScore);
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error grading exam:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to grade exam' 
    };
  }
}