import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface Question {
  id: number;
  status: 'correct' | 'wrong' | 'partial';
  score_obtained: number;
  score_max: number;
  deduction: number;
  box_2d: [number, number, number, number];
  analysis: string;
  error_type?: 'calculation' | 'concept' | 'logic';
}

export interface ExamPage {
  image_url: string;
  page_score: number;
  questions: Question[];
}

export interface ExamGradingResult {
  total_score: number;
  total_max_score: number;
  pages: ExamPage[];
  summary_tags: string[];
}

class GeminiService {
  private flashModel: GenerativeModel | null = null;
  private proModel: GenerativeModel | null = null;
  private apiKey: string | null = null;
  private qwenApiKey: string | null = null;
  private activeProvider: 'google' | 'qwen' = 'google';

  setApiKey(key: string, provider: 'google' | 'qwen' = 'google') {
    if (provider === 'google') {
      this.apiKey = key;
      this.flashModel = null;
      this.proModel = null;
    } else {
      this.qwenApiKey = key;
    }
    this.activeProvider = provider;
  }

  // ... (keep ensureInitialized)

  // Implementation of Qwen VL Call
  private async callQwenVL(prompt: string, images: File[]): Promise<string> {
    if (!this.qwenApiKey) throw new Error('Qwen API Key not set');

    const messages = [
      {
        role: 'user',
        content: [
          { text: prompt },
          // Compress images to reduce payload size and avoid timeouts
          ...await Promise.all(images.map(async (img) => ({ image: await this.compressImage(img) })))
        ]
      }
    ];

    // Use a CORS proxy to bypass browser restrictions on GitHub Pages
    // Note: In a real production app with a backend, you should proxy this through your own server.
    const proxyUrl = 'https://corsproxy.io/?';
    const targetUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

    // Increase timeout by handling it? Fetch doesn't support timeout natively easily, 
    // but the error is 504 Gateway Timeout from the proxy or server.
    // Compressing image is the best fix.
    const response = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.qwenApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen-vl-plus',
        input: { messages }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      // Handle HTML error pages from proxy
      if (err.includes('<!DOCTYPE html>')) throw new Error('Proxy Connection Failed (Timeout)');
      throw new Error(`Qwen API Error: ${err}`);
    }

    const data = await response.json();
    if (data.output?.choices?.[0]?.message?.content) {
      // Qwen VL Max currently returns mixed content, sometimes array. 
      // Usually content is a list of {text: ...}.
      const content = data.output.choices[0].message.content;
      if (Array.isArray(content)) {
        return content.map((c: any) => c.text).join('');
      }
      return typeof content === 'string' ? content : JSON.stringify(content);
    }
    throw new Error('Invalid Qwen Response');
  }

  // Compress and resize image for Qwen
  private async compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize to max 800px to prevent timeouts with large payloads
        const MAX_SIZE = 800;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Compress to JPEG quality 0.5
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }


  private ensureInitialized() {
    if (!this.flashModel || !this.proModel) {
      if (!this.apiKey) {
        throw new Error('Please provides Google Gemini API Key');
      }

      const genAI = new GoogleGenerativeAI(this.apiKey);
      // Use specific version tag -001 to avoid 404s on aliases in some regions/keys
      this.flashModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
      this.proModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
    }
  }

  async generateExamGrading(
    images: File[],
    totalMaxScore: number = 100
  ): Promise<ExamGradingResult> {

    // Check Active Provider: Qwen
    if (this.activeProvider === 'qwen') {
      if (!this.qwenApiKey) throw new Error('请先设置通义千问 API Key');

      const prompt = `
你是一位专业的试卷批改专家。请仔细分析提供的试卷图片，并严格按照以下要求输出JSON格式的批改结果。

【重要】语言要求：
- 检测试卷的语言（中文/英文等）
- 如果是中文试卷，所有分析、解释、标签必须使用纯中文，绝对不要出现任何英文单词
- 如果是英文试卷，所有分析使用纯英文
- 禁止中英文混用

批改要求：
1. 识别所有题目
2. 判断每题的正误状态（正确/错误/部分正确）
3. 计算得分，满分为 ${totalMaxScore}
4. 对于错题，用试卷的语言提供详细的解题步骤和正确答案
5. 错误类型分类：calculation（计算错误）、concept（概念错误）、logic（逻辑错误）

返回严格的JSON格式：
{
    "total_score": 数字,
    "total_max_score": ${totalMaxScore},
    "pages": [
    {
        "image_url": "page_1",
        "page_score": 数字,
        "questions": [
        {
            "id": 题号（数字）,
            "status": "correct"或"wrong"或"partial",
            "score_obtained": 实际得分,
            "score_max": 满分,
            "deduction": 扣分,
            "box_2d": [0,0,0,0],
            "analysis": "详细解析（必须使用试卷的语言，中文试卷用中文，英文试卷用英文）",
            "error_type": "calculation"或"concept"或"logic"
        }
        ]
    }
    ],
    "summary_tags": ["标签1（使用试卷语言）", "标签2"]
}
       `;

      try {
        const text = await this.callQwenVL(prompt, images);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Qwen response did not contain valid JSON');
        return JSON.parse(jsonMatch[0]) as ExamGradingResult;
      } catch (e: any) {
        throw new Error(`Qwen Grading Failed: ${e.message}`);
      }
    }

    // Default Google Logic
    this.ensureInitialized();
    const genAI = new GoogleGenerativeAI(this.apiKey!);

    // ... (keep imageParts processing) ...
    const imageParts = await Promise.all(
      images.map(async (image) => {
        const base64 = await this.fileToBase64(image);
        return {
          inlineData: {
            data: base64,
            mimeType: image.type,
          },
        };
      })
    );

    // ... (keep prompt definition) ...
    const prompt = `
你是一位专业的试卷批改专家。请仔细分析以下试卷图片，并提供详细的批改结果。

【重要】语言要求：
- 首先检测试卷的语言（中文、英文、数学等）
- 所有文本字段（"analysis"、"summary_tags"）必须使用与试卷相同的语言
- 中文试卷：analysis 和 tags 必须使用纯中文（例如："计算错误"、"概念理解不足"、"步骤不完整"）
- 英文试卷：analysis 和 tags 使用纯英文
- 严禁混合语言 - 保持输出语言与试卷语言一致

批改要求：
1. 识别试卷上的所有题目
2. 判断每道题的答案是否正确、错误或部分正确
3. 根据总分 ${totalMaxScore} 计算各题得分
4. 对于错题，用试卷的语言提供详细的分步解题过程和正确答案
5. 将错误分类为：'calculation'（计算错误）、'concept'（概念错误）或 'logic'（逻辑错误）
6. 为每道题生成边界框坐标（0-1000 归一化比例）
7. 用试卷的语言提供整体表现的总结标签
8. 只返回严格合法的 JSON 格式

返回严格的 JSON 格式：
{
  "total_score": 数字,
  "total_max_score": ${totalMaxScore},
  "pages": [
    {
      "image_url": 字符串（页码引用）,
      "page_score": 数字,
      "questions": [
        {
          "id": 数字,
          "status": "correct" | "wrong" | "partial",
          "score_obtained": 数字,
          "score_max": 数字,
          "deduction": 数字,
          "box_2d": [数字, 数字, 数字, 数字],
          "analysis": 字符串（用试卷语言详细解答）,
          "error_type": "calculation" | "concept" | "logic"（如适用）
        }
      ]
    }
  ],
  "summary_tags": 字符串数组（用试卷语言）
}
    `;

    // Add gemini-2.0-flash-exp to the list
    const modelsToTry = ['gemini-2.0-flash-exp', 'gemini-1.5-pro-002', 'gemini-1.5-flash-001', 'gemini-1.5-pro'];
    let lastError = null;

    for (const modelName of modelsToTry) {
      // ... (keep loop logic) ...
      try {
        console.log(`Attempting grading with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error(`Failed to parse JSON from ${modelName} response`);
        }

        return JSON.parse(jsonMatch[0]) as ExamGradingResult;
      } catch (error: any) {
        console.warn(`Model ${modelName} failed:`, error);
        lastError = error;
      }
    }

    // ... (keep final error throw) ...
    const msg = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`All models failed to grade exam. Last error: ${msg}`);
  }

  // New Method: OCR
  async recognizeText(image: File): Promise<string> {
    if (this.activeProvider === 'qwen') {
      const prompt = "Please extract all the text from this image exactly as it appears. Preserve formatting where possible.";
      try {
        return await this.callQwenVL(prompt, [image]);
      } catch (e: any) {
        throw new Error(`Qwen OCR Failed: ${e.message}`);
      }
    }

    this.ensureInitialized();
    const genAI = new GoogleGenerativeAI(this.apiKey!);
    const base64 = await this.fileToBase64(image);
    const part = { inlineData: { data: base64, mimeType: image.type } };

    const prompt = "Please extract all the text from this image exactly as it appears. Preserve formatting where possible.";

    // Try Gemini 2.0 Flash first
    const modelsToTry = ['gemini-2.0-flash-exp', 'gemini-1.5-flash-001', 'gemini-1.5-flash', 'gemini-1.5-pro-002', 'gemini-1.5-pro'];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([prompt, part]);
        return result.response.text();
      } catch (error: any) {
        console.warn(`OCR Model ${modelName} failed:`, error);
        lastError = error;
      }
    }
    const msg = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`OCR failed on all models. Last error: ${msg}`);
  }

  // New Method: Homework Solver
  async solveHomework(image: File, instruction?: string): Promise<string> {
    if (this.activeProvider === 'qwen') {
      const prompt = `
          You are a helpful AI tutor. The user has uploaded a homework problem.
          Instruction: ${instruction || "Solve this problem step-by-step and explain the concepts."}
          
          Please provide a clear, well-formatted response using Markdown.
          If it's a math problem, show calculation steps.
        `;
      try {
        return await this.callQwenVL(prompt, [image]);
      } catch (e: any) {
        throw new Error(`Qwen Homework Failed: ${e.message}`);
      }
    }

    this.ensureInitialized();
    const genAI = new GoogleGenerativeAI(this.apiKey!);
    const base64 = await this.fileToBase64(image);
    const part = { inlineData: { data: base64, mimeType: image.type } };

    const prompt = `
      You are a helpful AI tutor. The user has uploaded a homework problem.
      Instruction: ${instruction || "Solve this problem step-by-step and explain the concepts."}
      
      Please provide a clear, well-formatted response using Markdown.
      If it's a math problem, show calculation steps.
    `;

    // Try Gemini 2.0 Flash first
    const modelsToTry = ['gemini-2.0-flash-exp', 'gemini-1.5-pro-002', 'gemini-1.5-flash-001', 'gemini-1.5-pro'];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([prompt, part]);
        return result.response.text();
      } catch (error: any) {
        console.warn(`Homework Model ${modelName} failed:`, error);
        lastError = error;
      }
    }
    const msg = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`Homework solving failed on all models. Last error: ${msg}`);
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async generateSocraticTutoring(question: string, studentAnswer?: string): Promise<string> {
    this.ensureInitialized();

    const prompt = `
      You are a Socratic tutor. A student is working on this problem: "${question}"
      ${studentAnswer ? `Their answer is: "${studentAnswer}"` : ''}
      
      DO NOT provide the direct answer. Instead, guide the student through the problem step by step:
      1. First, identify the key concept or formula needed
      2. Then, provide a hint about the first step
      3. Finally, if needed, provide the complete solution
      
      Be encouraging and clear.
    `;

    try {
      const result = await this.flashModel!.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating tutoring:', error);
      throw new Error('Failed to generate tutoring');
    }
  }

  async generateEssayExamples(essayTopic: string): Promise<{
    creative: string;
    philosophical: string;
    analytical: string;
  }> {
    this.ensureInitialized();

    const prompt = `
      Generate three different style essays on the topic: "${essayTopic}"
      
      Return STRICT JSON:
      {
        "creative": "engaging, storytelling-style essay",
        "philosophical": "deep, reflective essay with philosophical insights",
        "analytical": "logical, well-structured analytical essay"
      }
    `;

    try {
      const result = await this.proModel!.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse JSON from AI response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error generating essay examples:', error);
      throw new Error('Failed to generate essay examples');
    }
  }
}

export const geminiService = new GeminiService();