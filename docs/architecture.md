# 架构说明

## 数据流

```
六科 expert agent（.codebuddy/agents/）
        │  梳理/校验背诵知识点
        ▼
assets/data.js  （window.SUBJECTS：单一数据源）
        │
        ▼
index.html + assets/app.js  （纯静态渲染：标签/搜索/标记已背/倒计时）
        │
        ├─ preview 技能 → 本地预览链接
        └─ github-connector + deploy.sh → GitHub Pages（公开站点）
```

## 关键设计

1. **单一数据源**：所有背诵内容集中在 `assets/data.js`。网页与各格式导出（docx/xlsx/pptx/pdf）都从它生成，避免多份不一致。
2. **零构建**：纯 HTML/CSS/JS，无需 npm/打包，GitHub Pages 直接托管；`data.js` 用全局变量注入，规避 `file://` 下的 fetch/CORS 问题，离线也能开。
3. **本地状态**："已背"标记存于浏览器 `localStorage`，不影响数据源。
4. **专家分工**：六科各一个 agent，负责把对应科目"需要背诵的内容"结构化产出为卡片（知识点/核心内容/易错/记忆技巧）。

## 下一步（内容填充）

按科目调用对应 expert agent，逐科扩充 `assets/data.js` 中的卡片，建议顺序：
语文（默写先行）→ 政治（原理多）→ 历史（年表）→ 地理（模板）→ 英语（词汇）→ 数学（公式）。
每科填充后可 `bash deploy.sh` 部署更新。
