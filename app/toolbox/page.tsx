'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, FileSpreadsheet, AlertTriangle } from 'lucide-react';

export default function ToolboxPage() {
  const [selectedTool, setSelectedTool] = useState<'mistake' | 'table' | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!selectedTool && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedTool('mistake')}
            >
              <CardHeader>
                <Printer className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>错题打印机</CardTitle>
                <CardDescription>
                  提取历史错题，生成练习卷
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedTool('table')}
            >
              <CardHeader>
                <FileSpreadsheet className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle>表格转 Excel</CardTitle>
                <CardDescription>
                  识别表格内容并导出为 Excel
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        {selectedTool === 'mistake' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setSelectedTool(null)}>
                返回
              </Button>
              <h2 className="text-xl font-semibold">错题打印机</h2>
              <div></div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  开发中
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  此功能正在开发中，敬请期待！
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedTool === 'table' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setSelectedTool(null)}>
                返回
              </Button>
              <h2 className="text-xl font-semibold">表格转 Excel</h2>
              <div></div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  开发中
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  此功能正在开发中，敬请期待！
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}