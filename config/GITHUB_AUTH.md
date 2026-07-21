# GitHub 授权指南（一次性操作）

部署到 GitHub Pages 前，需要让 CodeBuddy 获得访问你 GitHub 账号的权限。
这一步**必须你本人在 CodeBuddy 客户端里完成**（涉及你的 GitHub 账号，AI 无法代点）。
只需做一次，之后 `deploy.sh` 可随时推送。

## 为什么需要授权
本项目用 `github-connector` 的 `get_token.sh` 向平台网关换取 GitHub 访问令牌：

```
http://github.agent-gateway.auth-proxy.local/_internal/accesstoken
```

若账号未连接，网关返回 **HTTP 404**（此前验证即为此情况）。授权成功后才会返回可用令牌，
`deploy.sh` 才能把网页 `git push` 到你的仓库。

## 授权步骤

1. 打开 **CodeBuddy 设置**（客户端右上角齿轮 / 设置入口）。
2. 在设置中找到 **「连接器」**（Connectors）分类。
3. 在连接器列表里找到 **GitHub**，点击其 **「连接」/「授权」/「Connect」** 按钮。
4. 浏览器会弹出 **GitHub 登录与授权页**：
   - 用你要部署的 GitHub 账号登录；
   - 确认授权范围包含 **repo**（读写仓库，部署 GitHub Pages 必需）；
   - 点击 **Authorize / 授权**。
5. 回到 CodeBuddy，确认 GitHub 连接器状态变为 **已连接**。

## 授权后验证（让 AI 执行即可）
回到对话，让我运行一次令牌获取探测：

```bash
source /root/.codebuddy/skills/github-connector/scripts/get_token.sh github
```

- 成功：不再报 `HTTP 404`，说明已可部署。
- 仍 404：说明连接器未真正连接，请重试步骤 3–5，或重启客户端后重连。

## 验证通过后部署
1. 编辑 `/workspace/deploy.sh` 顶部的 `OWNER`（你的 GitHub 用户名）和 `REPO`（仓库名，如 `gaokao-memory`）。
2. 执行：

   ```bash
   bash deploy.sh
   ```

3. 首次推送后，到仓库 **Settings → Pages**，选择 `main` 分支、**根目录 (/)** 作为站点源，
   稍等片刻即可访问 `https://<OWNER>.github.io/<REPO>/`。

## 提示
- 令牌由平台安全托管，AI 不会打印或硬编码它（脚本一律用 `$GITHUB_TOKEN` 环境变量）。
- 若日后推送报 `401/403`，通常是授权过期，回到「连接器」重新授权 GitHub 即可。
