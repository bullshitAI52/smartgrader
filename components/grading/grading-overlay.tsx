'use client';

import { Question } from '@/lib/services/gemini';
import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface GradingOverlayProps {
  imageUrl: string;
  questions: Question[];
  imageWidth: number;
  imageHeight: number;
}

export function GradingOverlay({ imageUrl, questions, imageWidth, imageHeight }: GradingOverlayProps) {
  return (
    <div className="relative">
      <img
        src={imageUrl}
        alt="Exam page"
        className="w-full"
        style={{ maxHeight: '80vh' }}
      />
      
      <div className="absolute inset-0 pointer-events-none">
        {questions.map((question) => (
          <QuestionOverlay
            key={question.id}
            question={question}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
          />
        ))}
      </div>
    </div>
  );
}

interface QuestionOverlayProps {
  question: Question;
  imageWidth: number;
  imageHeight: number;
}

function QuestionOverlay({ question, imageWidth, imageHeight }: QuestionOverlayProps) {
  const { box_2d, status, score_obtained, score_max, analysis, error_type } = question;
  
  const [x, y, width] = box_2d;
  
  const left = (x / 1000) * imageWidth;
  const top = (y / 1000) * imageHeight;
  const boxWidth = (width / 1000) * imageWidth;

  const isCorrect = status === 'correct';
  
  const scoreDiff = score_obtained - score_max;

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: `${left + boxWidth}px`,
        top: `${top}px`,
        transform: 'translate(8px, -50%)',
      }}
    >
      {isCorrect ? (
        <div className="flex items-center gap-1">
          <Check className="w-8 h-8 text-green-500" strokeWidth={3} />
          {score_max > 0 && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              +{score_max}
            </Badge>
          )}
        </div>
      ) : (
        <Sheet>
          <SheetTrigger asChild>
            <div className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
              <X className="w-8 h-8 text-red-500" strokeWidth={3} />
              <Badge variant="outline" className="text-red-600 border-red-600">
                {scoreDiff}
              </Badge>
            </div>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <X className="w-5 h-5 text-red-500" />
                题目解析
                {error_type && (
                  <Badge variant="secondary" className="ml-2">
                    {getErrorTypeLabel(error_type)}
                  </Badge>
                )}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="font-semibold mb-2">得分情况</h4>
                <p className="text-gray-600">
                  本题得分: <span className="font-bold text-red-600">{score_obtained}</span> / {score_max}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">错误类型</h4>
                <p className="text-gray-600">{getErrorTypeDescription(error_type)}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">正确解析</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">
                    {analysis}
                  </pre>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
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

function getErrorTypeDescription(error_type?: string): string {
  switch (error_type) {
    case 'calculation':
      return '计算过程中出现的数值或运算错误，如粗心、计算符号错误等。';
    case 'concept':
      return '对知识点理解不够深入，概念混淆或理解偏差。';
    case 'logic':
      return '解题思路错误，推理过程不符合逻辑。';
    default:
      return '答案错误，需要进一步分析。';
  }
}