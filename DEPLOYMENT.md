# 部署与部署文档更新

- CI 将在每次推送时自动运行，确保代码在合并前通过构建与 lint。
- 部署目标为 Vercel，已在 repo 的 vercel.json 与 README/DEPLOYMENT.md 中提供了清晰的部署步骤。
- 若 CI 通过，可以直接通过 Vercel 的 Git 集成实现自动部署。

## CI/CD 指南（简要）
- 触发条件: push、pull_request
- 任务: 安装依赖、执行 ESLint、构建应用、静态分析
- 产出: 构建产物，检查通过后可部署

如果你愿意，我可以再为你添加一个专门的测试用例目录和简单的 E2E 测试来提升覆盖率。