# gov-todo

## 文件搜索

日常使用直接双击构建后的 `dist/index.html`，不需要启动任何服务。

文件搜索需要本地 Python 服务。保持 `dist/index.html` 打开，运行启动脚本后，页面会自动连接后台 API，不会打开新的网页。

```bash
npm run build
sh scripts/start-search-server.sh
```

Python 环境需要安装现有搜索脚本依赖 `pandas`；如需读取旧版 Office/WPS 文件，还需要安装 LibreOffice。开发调试也可以使用 `npm run search:server`。

内网环境下离线运行的个人 TODO 页面，按照轻重缓急划分为四个象限。

支持周期任务、数据导入/导出、归档任务历史查询。
