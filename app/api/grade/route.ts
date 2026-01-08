import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/lib/services/gemini';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const images = formData.getAll('images') as File[];
    const totalMaxScore = Number(formData.get('totalMaxScore')) || 100;

    if (images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images provided' },
        { status: 400 }
      );
    }

    const result = await geminiService.generateExamGrading(images, totalMaxScore);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error grading exam:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to grade exam' 
      },
      { status: 500 }
    );
  }
}