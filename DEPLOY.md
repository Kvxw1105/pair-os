# PairOS 部署指南

## 快速开始（推荐：Render 免费部署）

PairOS 是一个前后端一体的应用，使用 React + Express + Prisma + SQLite，可以零成本部署到 Render。

---

## 方案一：Render（免费，推荐）

### 特点

- ✅ **免费** — 信用卡都不需要绑
- ✅ **自动域名** — 部署完就给你 `xxx.onrender.com`
- ✅ **国内能访问** — 不需要翻墙
- ⚠️ **免费实例会休眠** — 15 分钟没人访问会睡着，下次访问要等 30-60 秒唤醒
- ⚠️ **SQLite 数据有限持久化** — 已配置 disk 挂载，但免费实例重启后仍可能丢失数据

### 部署步骤

#### 1. 准备代码

确保你的代码已经 push 到 GitHub（需要公开仓库或 Render 有权限的私有仓库）。

```bash
git add .
git commit -m "ready for deploy"
git push origin main
```

#### 2. 部署到 Render

**方法 A：Blueprint 一键部署（推荐）**

1. 打开 [Render Dashboard](https://dashboard.render.com)
2. 点击 **New** → **Blueprint**
3. 选择你的 GitHub 仓库
4. Render 会自动读取 `render.yaml` 并部署

**方法 B：手动创建 Web Service**

1. 打开 [Render Dashboard](https://dashboard.render.com)
2. 点击 **New** → **Web Service**
3. 选择你的 GitHub 仓库
4. 填写配置：
   - **Name**: `pair-os`（或你自己取）
   - **Runtime**: Node
   - **Build Command**:
     ```bash
     npm install && npm run build && cd server && npm install && npx prisma generate && npx prisma db push --accept-data-loss && npm run build
     ```
   - **Start Command**:
     ```bash
     cd server && npm start
     ```
   - **Plan**: Free
5. 添加环境变量：
   | 变量名 | 值 |
   |--------|-----|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `DATABASE_URL` | `file:./prod.db` |
   | `JWT_SECRET` | 随便打一串英文数字，比如 `pair-os-secret-2024-change-me` |
6. 点击 **Create Web Service**

#### 3. 访问你的应用

部署完成后，Render 会给你一个 URL，比如：

```
https://pair-os.onrender.com
```

把这个地址发给任何人，国内都能打开。

---

## 方案二：Fly.io（国内访问更快）

### 特点

- ✅ 新加坡节点对国内更友好
- ✅ 免费额度够用
- ⚠️ 需要安装 CLI

### 部署步骤

```bash
# 1. 安装 Fly CLI
# macOS/Linux:
curl -L https://fly.io/install.sh | sh
# Windows:
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# 2. 登录
fly auth login

# 3. 创建应用（首次）
fly launch --name pair-os --region sin

# 4. 部署
fly deploy
```

---

## 方案三：国内云服务器（最稳定，需要付费）

如果数据很重要，推荐用国内或香港的服务器：

| 服务商 | 推荐配置 | 价格 | 速度 |
|--------|---------|------|------|
| 阿里云轻量（香港） | 2核2G | ~100元/年 | 国内快 |
| 腾讯云轻量（香港） | 2核2G | ~100元/年 | 国内快 |
| 阿里云轻量（大陆） | 2核2G | ~99元/年 | 国内最快 |

步骤：
1. 买服务器
2. 安装 Node.js + PM2
3. `git clone` 你的代码
4. `npm install && npm run build`
5. `cd server && npm install && npx prisma db push && npm start`
6. 配置 Nginx 反向代理（可选）

---

## 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `PORT` | 是 | 服务端口，Render 默认 10000 |
| `JWT_SECRET` | 是 | JWT 签名密钥，随便打一串长字符 |
| `DATABASE_URL` | 是 | SQLite 文件路径，如 `file:./prod.db` |
| `NODE_ENV` | 是 | `production` |

---

## 常见问题

### Q: 免费 Render 数据会丢失吗？
A: 已配置 1GB disk 挂载，正常情况下数据会保留。但免费实例偶尔会被迁移，SQLite 文件可能丢失。**建议**：如果数据重要，升级到 Render 的 Starter 计划（$7/月），或使用 PostgreSQL 替代 SQLite。

### Q: 国内访问慢怎么办？
A: 免费 Render 是美国的，国内访问有时慢。可以：
- 用 Fly.io 新加坡节点（`sin`）
- 买阿里云/腾讯云香港服务器
- 先测试 Render 速度，如果可接受就继续用

### Q: 怎么自定义域名？
A: Render 和 Fly.io 都支持自定义域名：
1. 买个域名（阿里云/腾讯云/Cloudflare 都可以）
2. 在 Render Dashboard → Settings → Custom Domain 添加
3. 按提示配置 DNS 记录

### Q: 怎么更新部署？
A: 代码 push 到 GitHub 后，Render 会自动重新构建部署。如果是手动部署，需要重新部署。

---

## 本地开发 vs 生产部署

| 场景 | 命令 |
|------|------|
| 本地开发前端 | `npm run dev`（端口 3000） |
| 本地开发后端 | `cd server && npm run dev`（端口 3001） |
| 生产构建 | `npm run build && cd server && npm run build` |
| 生产启动 | `cd server && npm start` |

---

## 升级数据库

如果改了 Prisma schema：

```bash
cd server
npx prisma db push
```

生产环境同理，在 Build Command 里已经包含了 `npx prisma db push`。
