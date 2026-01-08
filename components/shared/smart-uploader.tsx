'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, X, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface ImagePreview {
  id: string;
  file: File;
  preview: string;
}

interface SmartUploaderProps {
  onUpload: (images: File[], totalMaxScore: number) => void;
  maxImages?: number;
}

export function SmartUploader({ onUpload, maxImages = 5 }: SmartUploaderProps) {
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [maxScore, setMaxScore] = useState<number>(100);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > maxImages) {
      alert(`最多只能上传 ${maxImages} 张图片`);
      return;
    }

    const processedFiles = await Promise.all(
      files.map(async (file) => {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        
        try {
          const compressedFile = await imageCompression(file, options);
          const preview = URL.createObjectURL(compressedFile);
          return {
            id: Math.random().toString(36).substring(7),
            file: compressedFile,
            preview,
          };
        } catch (error) {
          console.error('Error compressing image:', error);
          const preview = URL.createObjectURL(file);
          return {
            id: Math.random().toString(36).substring(7),
            file,
            preview,
          };
        }
      })
    );

    setImages((prev) => [...prev, ...processedFiles]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newImages.length) {
      [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
      setImages(newImages);
    }
  };

  const handleUpload = () => {
    if (images.length === 0) {
      alert('请先上传图片');
      return;
    }
    setShowScoreDialog(true);
  };

  const confirmUpload = () => {
    const files = images.map((img) => img.file);
    onUpload(files, maxScore);
    setShowScoreDialog(false);
    setImages([]);
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-4">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button onClick={() => fileInputRef.current?.click()} variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          上传图片 ({images.length}/{maxImages})
        </Button>
        <Button onClick={handleUpload} disabled={images.length === 0}>
          开始批改
        </Button>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {images.map((img, index) => (
            <div key={img.id} className="relative group">
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden border">
                <img
                  src={img.preview}
                  alt={`Page ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleMoveImage(index, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleMoveImage(index, 'down')}
                    disabled={index === images.length - 1}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveImage(img.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                第 {index + 1} 页
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">拖拽图片到这里，或点击上传按钮</p>
          <p className="text-sm text-gray-400 mt-2">支持 1-{maxImages} 张图片</p>
        </div>
      )}

      <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>设置试卷满分</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">本套试卷满分是多少？</label>
              <Input
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                min="1"
                max="1000"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMaxScore(100)}>
                100分
              </Button>
              <Button variant="outline" onClick={() => setMaxScore(120)}>
                120分
              </Button>
              <Button variant="outline" onClick={() => setMaxScore(150)}>
                150分
              </Button>
            </div>
            <Button onClick={confirmUpload} className="w-full">
              开始批改
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}