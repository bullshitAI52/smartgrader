'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, BookOpen, FileText } from 'lucide-react';

export default function TutorPage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [tutorResponse, setTutorResponse] = useState('');
  const [isTutoring, setIsTutoring] = useState(false);

  const handleTutor = async () => {
    if (!question.trim()) return;

    setIsTutoring(true);
    try {
      const response = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer }),
      });

      const result = await response.json();
      if (result.success) {
        setTutorResponse(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error:', error);
      setTutorResponse('辅导请求失败，请重试。');
    } finally {
      setIsTutoring(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="math" className="space-y-6">
          <TabsList>
            <TabsTrigger value="math" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              数学辅导
            </TabsTrigger>
            <TabsTrigger value="essay" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              作文辅导
            </TabsTrigger>
          </TabsList>

          <TabsContent value="math" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>输入题目</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">题目描述</label>
                  <Textarea
                    placeholder="请输入题目内容..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">你的答案（可选）</label>
                  <Textarea
                    placeholder="如果你已经尝试了解答，可以在这里写下你的答案..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button onClick={handleTutor} disabled={isTutoring || !question.trim()}>
                  <Send className="w-4 h-4 mr-2" />
                  {isTutoring ? '正在分析...' : '开始辅导'}
                </Button>
              </CardContent>
            </Card>

            {tutorResponse && (
              <Card>
                <CardHeader>
                  <CardTitle>辅导反馈</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {tutorResponse}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="essay" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>作文辅导</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">作文题目</label>
                  <Textarea
                    placeholder="请输入作文题目..."
                    rows={3}
                  />
                </div>
                <Button disabled>
                  <FileText className="w-4 h-4 mr-2" />
                  生成范文（开发中）
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}