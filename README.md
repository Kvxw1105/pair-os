# 共进 PairOS

> 和一个重要的人一起，把"我应该做"变成"我已经开始"。

共进 PairOS 是一个行动执行系统，不是待办清单。核心对象是 **Action（行动）**—— 记录一次次真实发生的执行过程，而不是长期悬挂的任务。

## 核心特性

- **快速开始**：一句话或一次点击即可开始行动
- **暂离与恢复**：外部事务中断时保存现场，可一键恢复
- **卡住处理**：区分内部阻力与外部中断，AI 只给一个下一步
- **双人模式**：固定伙伴可见行动状态与进展，不监控细节
- **行动上下文**：系统从真实数据推断规律，用户可见可纠正
- **时间线沉淀**：所有行动与事件形成可回看的长期轨迹

## 技术栈

- React 19 + TypeScript + Vite
- React Router 7
- Tailwind CSS 4
- Framer Motion（动效）
- Lucide React（图标）
- date-fns（日期处理）
- LocalStorage（数据持久化）

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
pair-os/
├── src/
│   ├── components/
│   │   └── Layout.tsx          # 底部导航布局 + 页面切换动画
│   ├── pages/
│   │   ├── TodayPage.tsx       # 今天（首页）- 快速开始、伙伴状态、今日轨迹
│   │   ├── ActionPage.tsx      # 执行中 - 计时、结束、暂离、卡住
│   │   ├── AwayPage.tsx        # 暂离 - 保存现场、预计返回、提醒
│   │   ├── BlockedPage.tsx     # 卡住 - 阻力分类、AI 下一步建议
│   │   ├── EndPage.tsx         # 结束 - 完成/部分/未完成/取消
│   │   ├── TimelinePage.tsx    # 轨迹 - 按日查看行动历史
│   │   ├── PartnerPage.tsx     # 我们 - 伙伴状态、共享数据、邀请
│   │   ├── ContextPage.tsx     # AI 理解我 - 上下文查看与编辑
│   │   ├── SettingsPage.tsx    # 设置 - 偏好、数据管理
│   │   └── OnboardingPage.tsx  # 首次使用引导
│   ├── stores/
│   │   └── AppStore.tsx        # 全局状态管理 + 状态机 + LocalStorage
│   ├── types/
│   │   └── index.ts            # TypeScript 类型定义
│   ├── utils/
│   │   └── time.ts             # 时间格式化工具
│   ├── main.tsx                # 应用入口 + 路由配置
│   └── index.css               # 全局样式 + Tailwind 配置
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

## 状态机

```
draft → ready → active → completed
                 ↓    ↓
                away  blocked
                 ↓    ↓
                active (恢复)
                 ↓
            partial / failed / cancelled
```

## 设计原则

- **移动端优先**：375px 宽度下核心流程无横向滚动
- **一屏一主动作**：每个关键页面只突出一个主要决定
- **输入可省略**：标题是唯一默认输入，其余自动推断
- **中断中性化**：外部暂离不计为失败，恢复率优先于连续打卡
- **AI 克制**：AI 只理解与提议，所有现实影响须用户确认

## 数据持久化

所有数据通过 `LocalStorage` 自动持久化，刷新页面后状态不丢失。包含：
- 用户资料与行动上下文
- 所有行动与事件记录
- 伙伴关系与提醒设置

## 演示数据

首次启动时自动加载演示数据，包含：
- 一个虚拟伙伴"小楠"（正在阅读《深度学习》）
- 多个已完成、暂离、部分完成的行动示例
- 对应的时间线事件

## 许可证

MIT
