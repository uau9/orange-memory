# 技能配置（Skills）

本项目按需启用以下技能。所有技能均已在 CodeBuddy 中预装，无需额外安装，按场景调用即可。

| 技能 | 在本项目中的用途 | 触发场景 |
|------|------------------|----------|
| **github-connector** | 把 `index.html` 等静态文件同步/部署到 GitHub Pages（见 `deploy.sh`） | "部署到 GitHub"、"推送代码"、"建 PR" |
| **preview** | 本地起静态服务器并生成预览链接，随时查看网页效果 | "预览"、"看效果"、"跑起来" |
| **docx** | 把某科背诵资料导出为 Word，方便打印成册 | "导出 Word"、"生成背诵手册" |
| **xlsx** | 生成背诵进度表 / 艾宾浩斯复习计划表 / 错题本 | "导出 Excel"、"做复习计划表" |
| **pptx** | 生成单科复习课件，便于串讲 | "导出 PPT"、"做复习课件" |
| **pdf** | 导出便携 PDF 复习手册（离线可看） | "导出 PDF"、"生成复习手册" |
| **automation-task-manager** | 创建/管理复习提醒定时任务（见 `automation.md`） | "每天提醒我背…"、"设个定时任务" |

## 使用约定

1. **网页为主、文档为辅**：核心载体是 GitHub Pages 网页；docx/xlsx/pptx/pdf 作为"导出/打印"补充，
   覆盖没有网络或想纸面复习的场景。
2. **内容单一来源**：所有背诵内容以 `assets/data/*.json` 为唯一数据源，网页与各类导出均从它生成，
   避免多份内容不一致。
3. **连接器授权**：github-connector 首次使用前，需在 CodeBuddy 设置 → 连接器 中完成 GitHub 授权。

## 各技能要点速记

- **github-connector**：优先用原生 `git`，token 通过 `source get_token.sh github` 注入环境变量，
  **严禁**打印或硬编码 token（详见 `deploy.sh`）。
- **preview**：静态站点用 `python3 -m http.server` 托管，绑定 `0.0.0.0`，最后用 `notify` 获取预览 URL。
- **automation-task-manager**：写操作（创建/编辑/删除任务）必须先预览、经用户确认后再执行；
  Cron 为 6 位 `秒 分 时 日 月 周`，时区 `Asia/Shanghai`。
