# 橙子高考背诵助手 🍊

> 为橙子（2027 年 6 月高考）梳理 **语文 / 数学 / 英语 / 历史 / 地理 / 政治** 六科所有需要背诵的知识点，
> 以网页端形式呈现，并部署到 GitHub Pages。

## 项目背景

- **考生**：橙子（女），目标 2027 年 6 月高考
- **选科**：语文、数学、英语、历史、地理、政治（文科组合）
- **目标**：把六科中需要**背诵/记忆**的内容系统化梳理，便于反复复习与自查
- **形态**：纯静态网页（无需后端），可离线打开，亦可一键部署到 GitHub Pages

## 目录结构

```
.
├── index.html              # 网站入口（六科导航 + 背诵卡片）
├── assets/                 # 样式、脚本、数据
│   └── data/               # 六科背诵知识点（按科目分文件）
├── .codebuddy/agents/      # 六科「背诵专家」自定义 agent 定义
├── config/                 # 技能映射、部署说明等配置文档
├── docs/                   # 架构与进度文档
├── deploy.sh               # 一键部署到 GitHub Pages
└── .nojekyll               # 关闭 Jekyll，保证静态站点原样托管
```

## 连接器（Connectors）

| 连接器 | 用途 | 状态 |
|--------|------|------|
| **GitHub** (`github-connector`) | 把网页同步/部署到 GitHub Pages | 技能已就绪；**需在 CodeBuddy 设置 → 连接器 中完成 GitHub 授权** |

部署步骤（授权后）：

```bash
# 1. 修改 deploy.sh 顶部的 OWNER / REPO
# 2. 执行
bash deploy.sh
# 3. 仓库 Settings → Pages → 选择 main 分支根目录
```

## 专家（Experts）

`/workspace/.codebuddy/agents/` 下为六科各定义了一个「背诵专家」agent，负责梳理与校验对应科目的背诵内容：

- `chinese-expert` — 古诗文默写、文言实词虚词、答题模板、作文素材
- `math-expert` — 公式定理、二级结论、解题模型、易错点
- `english-expert` — 3500 词、语法、固定搭配、读后续写/应用文模板
- `history-expert` — 大事年表、核心概念、阶段特征、答题模板
- `geography-expert` — 自然/人文/区域地理、区位分析模板、图表判读
- `politics-expert` — 四本必修 + 三本选必、核心原理、时政对接、答题模板

## 技能（Skills）

见 [`config/SKILLS.md`](config/SKILLS.md)：github-connector（部署）、preview（预览）、
docx/xlsx/pptx/pdf（多格式导出背诵资料）、automation-task-manager（复习提醒）。

## 自动化（Automation）

见 [`config/automation.md`](config/automation.md)：每日高考倒计时 + 背诵打卡提醒、每周复习计划生成等定时任务。

## 高考倒计时

> 2027 年高考预计为 **2027-06-07**。配合自动化任务每日播报剩余天数，提醒保持节奏。
