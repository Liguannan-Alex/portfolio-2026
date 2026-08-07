# 李冠南 · 个人主页 2026

暗金影视风格个人主页 — 产品经理 × 生成式 AI × 影视数字化。

**线上地址**：https://liguannan-alex.github.io/portfolio-2026/
**上一版主页**（保留）：https://liguannan-alex.github.io

## 技术栈

React 19 + TypeScript + Vite 7 + Tailwind + shadcn/ui，HashRouter 路由（适配 GitHub Pages 子目录部署）。

## 本地开发

```bash
npm ci
npm run dev      # 开发
npm run build    # 构建到 dist/
```

## 部署

GitHub Pages 从 `main` 分支的 `/docs` 目录发布。更新流程：

```bash
npm run build && rm -rf docs && cp -R dist docs && touch docs/.nojekyll
git add -A && git commit -m "更新主页" && git push
```

## 内容维护

所有文案集中在 `src/config.ts`，改文字不用碰组件。图片在 `public/images/`，均为 AI 生成配图（角标含「AI生成」标识）。
