# π·冠南的片场

个人 3D 作品集：https://piguannan.com/

## 源码与发布
- 当前首页源码：`studio/`；Three.js + Rapier + React。
- GitHub Pages 沿用 `main` 分支的 `/docs` 发布源，域名配置不变。
- `studio` 使用 Vinext 原生静态导出；产物没有服务端运行要求或 ChatGPT 登录要求。
- 旧主页保留在 https://piguannan.com/classic/ ，旧源码在 `src/`；旧说明见 README-classic.md。
- `teaching/`、`ai-course/`、`lesson-1/`、`bluebook/`、`learn-ai/`、`radar/` 与 `files/` 保持原地址。

## 本地开发
```sh
npm run setup:studio
npm run dev
```

## 构建与发布
```sh
npm run build
git add studio docs scripts package.json README.md
git commit -m "Update studio"
git push origin main
```
`stage-studio.mjs` 合并新静态资源，不清空原有子页面。提交前检查 Git diff。

## 开源资源
车辆模型、树叶纹理基于 Bruno Simon folio-2025 的 MIT 开源资源，许可保留在 `studio/public/world/BRUNO-MIT-LICENSE.txt` 及线上 `/world/BRUNO-MIT-LICENSE.txt`。场所与内容按李冠南的公开履历及项目组织。
