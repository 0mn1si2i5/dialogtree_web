# DialogTree Web 🌳

> 支持对话分叉的智能对话系统前端应用

## 📋 项目概述

DialogTree 是一个创新的智能对话系统，支持从任意历史对话点开始新的分支对话，形成树状的对话结构。用户可以探索不同的对话路径，实现真正的多维度对话体验。

## ✨ 核心特性

- 🌳 **对话树可视化** - 基于D3.js的动态对话树展示
- 🔀 **智能分叉** - 从任意对话点开始新的分支
- 💬 **流式响应** - 实时SSE流式AI回复
- 📱 **响应式设计** - 适配各种屏幕尺寸
- ⭐ **对话管理** - 标星、评论、搜索功能
- 📂 **分类管理** - 灵活的会话分类系统

## 🏗️ 技术架构

### 前端技术栈
- **Vue 3** + **TypeScript** - 现代化前端框架
- **Arco Design Vue** - 企业级UI组件库
- **D3.js** - 强大的数据可视化库
- **Pinia** - Vue3官方状态管理
- **Vite** - 极速构建工具
- **Axios** - HTTP客户端
- **Day.js** - 轻量级日期处理

### 项目结构
```
src/
├── api/           # API接口层
├── assets/        # 静态资源
├── components/    # Vue组件
├── router/        # 路由配置
├── stores/        # Pinia状态管理
├── styles/        # 全局样式
├── types/         # TypeScript类型定义
├── utils/         # 工具函数
└── views/         # 页面组件
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

项目将在 `http://localhost:8008` 启动

### 构建生产版本
```bash
npm run build
```

### 类型检查
```bash
npm run type-check
```

## 🎨 界面设计

### 三栏布局设计
- **左侧栏** (280px) - Session列表和Category分类
- **中间区域** (自适应) - D3.js对话树可视化
- **右侧栏** (350px) - ChatGPT风格聊天界面

### 核心组件
- `SessionSidebar` - 会话管理侧边栏
- `DialogTreeVisualization` - D3.js对话树可视化
- `ChatPanel` - 实时聊天界面

## 🔌 API集成

### 后端接口
项目支持以下API端点：

- `GET /api/sessions` - 获取会话列表
- `POST /api/sessions` - 创建新会话
- `GET /api/sessions/{id}/tree` - 获取对话树
- `POST /api/dialog/chat` - 创建对话(SSE流式)
- `PUT /api/dialog/conversations/{id}/star` - 标星操作

### 流式响应
支持Server-Sent Events (SSE)实时流式AI回复，提供流畅的用户体验。

## 🌳 对话树功能

### D3.js可视化特性
- ✅ 动态树状图渲染
- ✅ 节点缩放和拖拽
- ✅ 平滑动画过渡
- ✅ 节点点击交互
- ✅ 自适应布局

### 分叉机制
- 从任意历史对话点开始新对话
- 自动检测和处理分叉逻辑
- 保持完整的对话历史记录

## 📱 响应式设计

项目采用现代响应式设计，支持：
- 桌面端 (1200px+)
- 平板端 (768px-1199px)
- 移动端 (< 768px)

## 🔧 开发指南

### 状态管理
使用Pinia进行状态管理：
- `useSessionStore` - 会话和分类管理
- `useDialogStore` - 对话树和消息管理

### 类型安全
项目采用完整的TypeScript类型覆盖，确保开发时的类型安全。

### 代码规范
- ESLint + Prettier代码格式化
- 组件化开发模式
- 统一的错误处理机制

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**开发状态**: 基础框架已完成，对话树可视化进行中 🟢  
**最后更新**: 2025-07-28 