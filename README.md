# gov-todo

内网环境下离线运行的个人 TODO 页面，按照轻重缓急划分为四个象限。

支持周期任务、JSON 数据导入/导出、CSV 任务导出和归档任务历史查询。

## 使用

从 [Releases](https://github.com/DJChanahCJD/gov-todo/releases) 下载 `gov-todo.html`，双击即可在浏览器中直接运行（无需安装、无需联网）。

数据存储于浏览器 IndexedDB。

## 开发

```powershell
npm install
npm run dev        # 本地开发
npm run build      # 构建单文件产物 dist/index.html
```

## 发版

```powershell
npm version patch    # 更新版本号 + commit + 本地 tag
npm run release      # 构建 → 推送分支与 tag → 创建 GitHub Release（附件 gov-todo.html）
```

各步骤相互独立、幂等，失败后可从对应步骤重试：

| 失败位置 | 重试命令                                     |
| -------- | -------------------------------------------- |
| 构建     | `npm run release:build`                      |
| 推送     | `npm run release:push`                       |
| Release  | `npm run release:github`（已存在则自动跳过） |
