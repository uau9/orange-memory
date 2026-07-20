#!/usr/bin/env bash
#
# 橙子高考背诵助手 · 一键部署到 GitHub Pages
# 前置条件：在 CodeBuddy 设置页的「连接器」中完成 GitHub 授权（首次使用）。
# 用法：
#   1) 修改下方 OWNER/REPO 为你自己的仓库（如 orange/gaokao-memory）
#   2) 在项目根目录执行：bash deploy.sh
#
set -e

OWNER="${OWNER:-orange}"          # ← 改成你的 GitHub 用户名
REPO="${REPO:-gaokao-memory}"      # ← 改成你的仓库名
BRANCH="main"

echo "==> 拉取 GitHub Token（不打印明文）"
source /root/.codebuddy/skills/github-connector/scripts/get_token.sh github

echo "==> 提交本地改动"
git add -A
if git diff --cached --quiet; then
  echo "  没有需要提交的改动，跳过 commit。"
else
  git commit -m "chore: update 背诵资料 $(date +%Y-%m-%d)"
fi

echo "==> 配置带 Token 的远程地址并推送"
git remote set-url origin "https://oauth2:${GITHUB_TOKEN}@github.com/${OWNER}/${REPO}.git" || \
  git remote add origin "https://oauth2:${GITHUB_TOKEN}@github.com/${OWNER}/${REPO}.git"
git push -u origin "${BRANCH}"

echo "==> 完成。请在仓库 Settings → Pages 选择 ${BRANCH} 分支根目录作为站点源。"
echo "    站点地址通常为：https://${OWNER}.github.io/${REPO}/"
