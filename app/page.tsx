'use client';

import { useState } from 'react';
import { SmartUploader } from '@/components/shared/smart-uploader';
import { GradingOverlay } from '@/components/grading/grading-overlay';
import { ExportCanvas } from '@/components/grading/export-canvas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { ExamGradingResult } from '@/lib/services/gemini';

export default function Home() {
  const [images, setImages] = useState<string[]>([]);
  const [gradingResult, setGradingResult] = useState<ExamGradingResult | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (files: File[], totalMaxScore: number) => {
    setIsGrading(true);
    setError(null);
    
    try {
      const imageUrls = files.map((file) => URL.createObjectURL(file));
      setImages(imageUrls);

      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));
      formData.append('totalMaxScore', totalMaxScore.toString());

      const response = await fetch('/api/grade', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to grade exam');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to grade exam');
      }

      setGradingResult(result.data);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGrading(false);
    }
  };

  const wrongCount = gradingResult?.pages.reduce(
    (sum, page) => sum + page.questions.filter((q) => q.status === 'wrong').length,
    0
  ) || 0;

  const correctCount = gradingResult?.pages.reduce(
    (sum, page) => sum + page.questions.filter((q) => q.status === 'correct').length,
    0
  ) || 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {!gradingResult && (
          <Card>
            <CardHeader>
              <CardTitle>上传试卷</CardTitle>
            </CardHeader>
            <CardContent>
              <SmartUploader onUpload={handleUpload} />
            </CardContent>
          </Card>
        )}

        {isGrading && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                <p className="text-lg text-gray-600">正在批改试卷...</p>
                <p className="text-sm text-gray-500">AI正在分析每一道题目</p>
              </div>
            </CardContent>
          </Card>
        )}

        {gradingResult && (
          <Tabs defaultValue="result" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="result">批改结果</TabsTrigger>
              <TabsTrigger value="export">导出分享</TabsTrigger>
            </TabsList>

            <TabsContent value="result" className="space-y-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-lg">
                <div className="text-center">
                  <p className="text-sm uppercase tracking-wide mb-2">总分</p>
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-6xl font-bold">
                      {gradingResult.total_score}
                    </span>
                    <span className="text-3xl text-white/80">
                      / {gradingResult.total_max_score}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>正确: {correctCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5" />
                      <span>错误: {wrongCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {images.map((imageUrl, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>第 {index + 1} 页</span>
                        <Badge variant="outline">
                          得分: {gradingResult.pages[index]?.page_score || 0}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <GradingOverlay
                        imageUrl={imageUrl}
                        questions={gradingResult.pages[index]?.questions || []}
                        imageWidth={600}
                        imageHeight={800}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {gradingResult.summary_tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      学情分析
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {gradingResult.summary_tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="export">
              <Card>
                <CardHeader>
                  <CardTitle>导出试卷结果</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExportCanvas images={images} gradingResult={gradingResult} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}