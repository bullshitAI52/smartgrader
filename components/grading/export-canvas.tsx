'use client';

import { useRef } from 'react';
import html2canvas from 'html2canvas';
import { ExamGradingResult } from '@/lib/services/gemini';
import { Button } from '@/components/ui/button';
import { Download, Share2 } from 'lucide-react';

interface ExportCanvasProps {
  images: string[];
  gradingResult: ExamGradingResult;
}

export function ExportCanvas({ images, gradingResult }: ExportCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const exportImage = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `exam-result-${gradingResult.total_score}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Error exporting image:', error);
    }
  };

  const shareImage = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], 'exam-result.png', { type: 'image/png' });
        
        if (navigator.share) {
          await navigator.share({
            title: '试卷批改结果',
            text: `得分: ${gradingResult.total_score}/${gradingResult.total_max_score}`,
            files: [file],
          });
        } else {
          alert('当前浏览器不支持分享功能');
        }
      });
    } catch (error) {
      console.error('Error sharing image:', error);
    }
  };

  const wrongQuestions = gradingResult.pages.flatMap((page, pageIndex) =>
    page.questions
      .filter((q) => q.status !== 'correct')
      .map((q) => ({ ...q, pageIndex }))
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={exportImage} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          导出图片
        </Button>
        <Button onClick={shareImage} variant="outline">
          <Share2 className="w-4 h-4 mr-2" />
          分享
        </Button>
      </div>

      <div
        ref={canvasRef}
        className="bg-white p-8"
        style={{ maxWidth: '800px', margin: '0 auto' }}
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-center mb-2">试卷批改结果</h1>
          <div className="text-center">
            <span className="text-5xl font-bold text-red-600">
              {gradingResult.total_score}
            </span>
            <span className="text-2xl text-gray-600 ml-2">
              / {gradingResult.total_max_score}
            </span>
          </div>
        </div>

        <div className="space-y-8">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative">
              <img
                src={imageUrl}
                alt={`Page ${index + 1}`}
                className="w-full border rounded"
              />
              <div className="mt-2 text-center text-sm text-gray-500">
                第 {index + 1} 页 - 得分: {gradingResult.pages[index]?.page_score || 0}
              </div>
            </div>
          ))}
        </div>

        {wrongQuestions.length > 0 && (
          <div className="mt-12 border-t pt-8">
            <h2 className="text-2xl font-bold mb-6">错题解析附录</h2>
            
            <div className="space-y-6">
              {wrongQuestions.map((question) => (
                <div key={question.id} className="border-l-4 border-red-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold">
                      题目 {question.id}
                    </span>
                    <span className="text-sm text-gray-500">
                      (第 {question.pageIndex + 1} 页)
                    </span>
                    <span className="ml-auto text-red-600 font-bold">
                      {question.score_obtained}/{question.score_max}
                    </span>
                  </div>

                  {question.error_type && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">错误类型: </span>
                      <span className="text-sm text-red-600">
                        {getErrorTypeLabel(question.error_type)}
                      </span>
                    </div>
                  )}

                  <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">正确解析:</span>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded text-sm">
                    <pre className="whitespace-pre-wrap font-mono">
                      {question.analysis}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {gradingResult.summary_tags.length > 0 && (
          <div className="mt-12 border-t pt-8">
            <h2 className="text-2xl font-bold mb-4">学情分析</h2>
            <div className="flex flex-wrap gap-2">
              {gradingResult.summary_tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getErrorTypeLabel(error_type?: string): string {
  switch (error_type) {
    case 'calculation':
      return '计算错误';
    case 'concept':
      return '概念错误';
    case 'logic':
      return '逻辑错误';
    default:
      return '错误';
  }
}