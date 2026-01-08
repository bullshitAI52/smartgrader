# SmartGrader (Nano Banana Pro)

智能阅卷系统 - AI驱动的家庭作业辅导工具

## 功能特性

- 🔴 **智能阅卷 (Check Mode)** - AI自动批改试卷，提供红勾红叉视觉反馈
- 🟢 **作业辅导 (Tutor Mode)** - 苏格拉底式启发辅导，数学/作文辅导
- 🔵 **万能工具箱 (Toolbox)** - 错题打印机、表格转Excel等实用工具
- 🟣 **学情分析 (Dashboard)** - 能力雷达图、薄弱点追踪、得分趋势

## 技术栈

- **Framework**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Library**: Shadcn UI, Lucide React
- **AI**: Google Gemini 1.5 Pro/Flash
- **Utils**: html2canvas, recharts, browser-image-compression

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.local.example` 为 `.env.local`:

```bash
cp .env.local.example .env.local
```

编辑 `.env.local` 文件，添加你的 Google AI API Key:

```
GOOGLE_AI_API_KEY=your_api_key_here
```

获取 API Key: https://makersuite.google.com/app/apikey

### 3. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 http://localhost:3000

## 项目结构

```
smartgrader/
├── app/
│   ├── actions/           # Server Actions
│   ├── api/               # API Routes
│   ├── check/             # Check Mode page
│   ├── tutor/             # Tutor Mode page
│   ├── toolbox/           # Toolbox page
│   ├── dashboard/         # Dashboard page
│   └── layout.tsx         # Root layout
├── components/
│   ├── grading/           # Grading components
│   ├── shared/            # Shared components
│   └── ui/                # Shadcn UI components
├── lib/
│   ├── strategies/        # Grading strategies
│   ├── factories/         # Strategy factory
│   └── services/          # Services (Gemini, etc.)
└── public/                # Static assets
```

## 核心功能说明

### 智能阅卷 (Check Mode)

1. 上传1-5张试卷图片
2. 设置试卷满分（默认100分）
3. AI自动分析每道题目
4. 显示红勾红叉和分数
5. 点击红叉查看详细解析
6. 导出长图分享

### 作业辅导 (Tutor Mode)

- **数学辅导**: 输入题目，AI提供苏格拉底式引导
- **作文辅导**: 生成不同风格范文（生动有趣版、深刻哲理版、逻辑严谨版）

### 工具箱 (Toolbox)

- **错题打印机**: 提取错题，生成练习卷
- **表格转Excel**: 识别表格并导出

### 学情分析 (Dashboard)

- 能力雷达图（计算能力、概念理解、逻辑思维等）
- 薄弱点追踪
- 得分趋势分析

## 开发说明

### 添加新的批改策略

1. 在 `lib/strategies/` 创建新的策略类
2. 继承 `BaseGradingStrategy`
3. 在 `lib/factories/strategy-factory.ts` 注册新策略

### 添加新的UI组件

1. 在 `components/` 下创建组件
2. 遵循现有的代码风格
3. 使用 Shadcn UI 组件作为基础

## 部署

### Vercel (推荐)

```bash
npm run build
```

在 Vercel 中导入项目，配置环境变量即可。

### 其他平台

确保在部署时配置好 `GOOGLE_AI_API_KEY` 环境变量。

## 许可证

MIT

## 联系方式

如有问题或建议，请提交 Issue。
