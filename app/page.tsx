'use client';

import { useState, useEffect } from 'react';
import { SmartUploader } from '@/components/shared/smart-uploader';
import { GradingOverlay } from '@/components/grading/grading-overlay';
import { ExportCanvas } from '@/components/grading/export-canvas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'; // Using shadcn Tabs for main nav
import { CheckCircle2, XCircle, RefreshCw, X, Settings2, Sparkles, BrainCircuit, GraduationCap, ScanText, FileText, BookOpen } from 'lucide-react';
import { ExamGradingResult, geminiService } from '@/lib/services/gemini';
import { cn } from '@/lib/utils';

export default function Home() {
  const [activeTab, setActiveTab] = useState('grading'); // Default to Grading

  // -- Shared State --
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // -- Grading State --
  const [gradingImages, setGradingImages] = useState<string[]>([]);
  const [gradingResult, setGradingResult] = useState<ExamGradingResult | null>(null);
  const [imageDimensions, setImageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map());

  // -- OCR State --
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);

  // -- Homework State --
  const [hwImage, setHwImage] = useState<string | null>(null);
  const [hwQuestion, setHwQuestion] = useState('');
  const [hwResult, setHwResult] = useState<string | null>(null);

  // -- Init --
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      geminiService.setApiKey(storedKey);
    } else {
      setShowApiKeyModal(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      setError('API Key 不能为空');
      return;
    }
    localStorage.setItem('gemini_api_key', apiKey);
    geminiService.setApiKey(apiKey);
    setShowApiKeyModal(false);
  };

  const checkApiKey = () => {
    if (!apiKey) {
      setShowApiKeyModal(true);
      return false;
    }
    return true;
  };

  // -- Handlers --

  // 1. Grading Handler
  const handleGradingUpload = async (files: File[], totalMaxScore: number) => {
    if (!checkApiKey()) return;

    // 参数前置校验，提升鲁棒性
    if (!files || files.length === 0) {
      setError('请选择要上传的图片');
      return;
    }

    if (files.length > 5) {
      setError('最多上传 5 张图片');
      return;
    }

    if (!Number.isFinite(totalMaxScore) || totalMaxScore < 1 || totalMaxScore > 1000) {
      setError('满分值必须在 1-1000 之间');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await geminiService.generateExamGrading(files, totalMaxScore);
      setGradingImages(files.map(f => URL.createObjectURL(f)));
      setImageDimensions(new Map());
      setGradingResult(result);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'An error occurred during grading';
      if (message.includes('API Key')) {
        setError('无效或缺失的 API Key。请检查您的设置。');
        setShowApiKeyModal(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetGrading = () => {
    setGradingImages([]);
    setGradingResult(null);
    setImageDimensions(new Map());
  };

  // 2. OCR Handler
  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!checkApiKey()) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrImage(URL.createObjectURL(file));
    setOcrResult(null);
    setLoading(true);
    setError(null);

    try {
      const text = await geminiService.recognizeText(file);
      setOcrResult(text);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'An error occurred during OCR';
      if (message.includes('API Key')) {
        setError('无效或缺失的 API Key。请检查您的设置。');
        setShowApiKeyModal(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Homework Handler
  const handleHwUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setHwImage(URL.createObjectURL(file));
  };

  const submitHomework = async () => {
    if (!checkApiKey()) return;
    if (!hwImage) {
      setError('请先上传题目图片');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Need the file object again, fetching from blob url is one way or just storing file in state
      // For simplicity/robustness, let's fetch the blob
      const response = await fetch(hwImage);
      const blob = await response.blob();
      const file = new File([blob], "homework.jpg", { type: blob.type });

      const solution = await geminiService.solveHomework(file, hwQuestion);
      setHwResult(solution);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'An error occurred during homework solving';
      if (message.includes('API Key')) {
        setError('无效或缺失的 API Key。请检查您的设置。');
        setShowApiKeyModal(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // -- Render Helpers --

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100">

      {/* Configure Dialog */}
      <Dialog open={showApiKeyModal} onOpenChange={setShowApiKeyModal}>
        <DialogContent className="sm:max-w-md bg-white border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-600">
              <Settings2 className="w-5 h-5" />
              设置 API Key
            </DialogTitle>
            <DialogDescription>
              请输入您的 Google Gemini API Key 以使用 AI 功能。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 transition-all font-mono"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSaveApiKey} className="w-full bg-indigo-600 hover:bg-indigo-700">保存并继续</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-gray-900">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <BrainCircuit size={18} />
            </div>
            SmartGrader
          </div>

          <Button variant="ghost" size="icon" onClick={() => setShowApiKeyModal(true)}>
            <Settings2 className="w-5 h-5 text-gray-500" />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Main Tabs Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1.5 rounded-full border shadow-sm inline-flex">
            {[
              { id: 'ocr', label: '文字识别', icon: ScanText },
              { id: 'grading', label: '试卷批改', icon: FileText },
              { id: 'homework', label: '作业辅导', icon: BookOpen },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(null); }}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="mb-6 mx-auto max-w-md bg-red-50 text-red-600 px-4 py-3 rounded-xl flex items-center justify-between border border-red-100 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <XCircle size={18} />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {/* Tab Content: OCR */}
        {activeTab === 'ocr' && (
          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-8 animate-in fade-in">
            <Card className="border-gray-200 shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="text-lg">上传图片</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleOcrUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {ocrImage ? (
                    <img src={ocrImage} className="max-h-64 mx-auto rounded-lg shadow-sm" />
                  ) : (
                    <div className="space-y-2 text-gray-400">
                      <ScanText className="w-12 h-12 mx-auto opacity-50" />
                      <p className="text-sm">点击或拖拽上传</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="text-lg">识别结果</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-h-[300px] p-4 bg-gray-50 rounded-xl text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                  {loading ? (
                    <div className="flex items-center justify-center h-full text-indigo-500 gap-2">
                      <RefreshCw className="animate-spin" /> 正在识别...
                    </div>
                  ) : (
                    ocrResult || "等待上传..."
                  )}
                </div>
                {ocrResult && (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => navigator.clipboard.writeText(ocrResult)}
                  >
                    复制文本
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Content: Grading (Original Logic) */}
        {activeTab === 'grading' && (
          <div className="animate-in fade-in">
            {!gradingResult && !loading ? (
              <div className="max-w-2xl mx-auto">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                      AI 智能阅卷系统
                    </CardTitle>
                    <p className="text-gray-500 text-sm mt-2">支持多页上传 / 自动评分 / 错题分析</p>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <SmartUploader onUpload={handleGradingUpload} />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                {loading && (
                  <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-800">正在批改试卷...</h3>
                    <p className="text-gray-500 mt-2">AI 正在分析每一道题目，请稍候</p>
                  </div>
                )}

                {!loading && gradingResult && (
                  <div className="space-y-6">
                    {/* Score Header */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
                      <div>
                        <p className="text-gray-500 font-medium uppercase text-xs tracking-wider mb-1">总分</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-6xl font-bold text-indigo-900">{gradingResult.total_score}</span>
                          <span className="text-2xl text-gray-400">/ {gradingResult.total_max_score}</span>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="text-center px-6 py-3 bg-green-50 rounded-xl">
                          <div className="text-2xl font-bold text-green-700">
                            {gradingResult.pages.reduce((acc, p) => acc + p.questions.filter(q => q.status === 'correct').length, 0)}
                          </div>
                          <div className="text-xs text-green-600 font-medium">正确</div>
                        </div>
                        <div className="text-center px-6 py-3 bg-red-50 rounded-xl">
                          <div className="text-2xl font-bold text-red-700">
                            {gradingResult.pages.reduce((acc, p) => acc + p.questions.filter(q => q.status === 'wrong').length, 0)}
                          </div>
                          <div className="text-xs text-red-600 font-medium">错误</div>
                        </div>
                      </div>

                      <Button onClick={resetGrading} variant="outline" className="h-12 px-6 rounded-full border-gray-200">
                        批改下一份
                      </Button>
                    </div>

                    {/* Images & Overlay */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {gradingImages.map((imgUrl, idx) => (
                        <Card key={idx} className="overflow-hidden border-gray-200 shadow-sm group">
                          <CardHeader className="py-3 bg-gray-50 border-b border-gray-100 flex flex-row items-center justify-between">
                            <span className="font-semibold text-gray-700">第 {idx + 1} 页</span>
                            <Badge variant="secondary">得分: {gradingResult.pages[idx].page_score}</Badge>
                          </CardHeader>
                          <div className="relative">
                            <img
                              src={imgUrl}
                              className="w-full h-auto"
                              ref={el => {
                                if (el?.naturalWidth) {
                                  setImageDimensions(prev => new Map(prev).set(idx, { width: el.naturalWidth, height: el.naturalHeight }));
                                }
                              }}
                            />
                            <div className="absolute inset-0">
                              <GradingOverlay
                                imageUrl={imgUrl}
                                questions={gradingResult.pages[idx].questions}
                                imageWidth={imageDimensions.get(idx)?.width || 600}
                                imageHeight={imageDimensions.get(idx)?.height || 800}
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Export */}
                    <div className="mt-8">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                        生成报告
                      </h3>
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <ExportCanvas images={gradingImages} gradingResult={gradingResult} />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab Content: Homework */}
        {activeTab === 'homework' && (
          <div className="max-w-4xl mx-auto animate-in fade-in">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader><CardTitle>1. 上传题目</CardTitle></CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl h-64 flex flex-col items-center justify-center relative hover:bg-gray-50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleHwUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {hwImage ? (
                        <img src={hwImage} className="max-h-56 rounded-lg" />
                      ) : (
                        <div className="text-center text-gray-400">
                          <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <span>拍照上传作业题目</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 shadow-sm">
                  <CardHeader><CardTitle>2. 补充说明 (可选)</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="例如：请详细解释这道题的公式原理..."
                      value={hwQuestion}
                      onChange={e => setHwQuestion(e.target.value)}
                      className="bg-gray-50 border-gray-200 resize-none h-32"
                    />
                    <Button
                      className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-lg"
                      disabled={!hwImage || loading}
                      onClick={submitHomework}
                    >
                      {loading ? <RefreshCw className="animate-spin mr-2" /> : <Sparkles className="mr-2 w-5 h-5" />}
                      AI 开始辅导
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-gray-200 shadow-sm h-full max-h-[800px] flex flex-col">
                <CardHeader className="border-b border-gray-50">
                  <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="text-indigo-600 w-5 h-5" />
                    AI 辅导解析
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6">
                  {loading && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                      <RefreshCw className="w-10 h-10 animate-spin text-indigo-500" />
                      <p>AI 老师正在解题中...</p>
                    </div>
                  )}
                  {!loading && !hwResult && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <p>等待提交作业...</p>
                    </div>
                  )}
                  {!loading && hwResult && (
                    <div className="prose prose-indigo max-w-none text-sm leading-7">
                      <div dangerouslySetInnerHTML={{ __html: hwResult.replace(/\n/g, '<br/>') }} />
                      {/* Ideally render markdown properly here, but for simplicity text/br is okay for now unless we add a markdown parser */}
                      {/* But note: hwResult is raw text from Gemini, likely Markdown. */}
                      <pre className="whitespace-pre-wrap font-sans text-gray-700">{hwResult}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}