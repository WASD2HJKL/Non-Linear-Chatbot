# 非线性聊天机器人 🌳

[![GitHub stars](https://img.shields.io/github/stars/WASD2HJKL/Non-Linear-Chatbot?style=for-the-badge&logo=github&label=Stars&logoColor=white&color=ffda65)](https://github.com/WASD2HJKL/Non-Linear-Chatbot/stargazers)

[English](README.md) | [简体中文](README.zh-CN.md)

一款革命性的对话式 AI 应用程序，突破了传统线性聊天界面的限制。创建分支对话树，探索多条对话路径，并将您的对话可视化为交互式节点图。

![Version](https://img.shields.io/badge/version-0.0.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)
![Wasp](https://img.shields.io/badge/wasp-0.17.0-yellow)

## ✨ 功能特性

### 🌿 分支对话

- 在任意点分叉对话以探索不同的对话路径
- 无缝地在对话分支之间导航
- 在探索替代回复时保留上下文

### 📊 交互式可视化

- 基于 ReactFlow 的实时对话树可视化
- 拖放节点来组织您的对话地图
- 可调整大小的面板以获得最佳查看体验
- 活动对话线程的视觉路径高亮
- 展开全部/折叠全部按钮，便于管理大型对话树

### 🤖 AI 集成

- 支持 OpenAI 兼容 API 接口的多提供商 AI 支持
- 服务器端流式传输以确保 API 密钥安全管理
- 支持 OpenAI、Gemini、OpenRouter 和其他云提供商
- **本地 AI 模型支持**用于开发（Ollama、phi3-mini 等）
- 开发环境的本地代理配置
- 基于队列的 NDJSON 解析的实时响应流
- 通过用户友好的设置进行可配置的提供商和模型选择
- 跨提供商的统一错误处理和规范化

### 🎨 现代化 UI/UX

- 干净、响应式的基于 Bootstrap 的设计
- 支持深色/浅色主题，零闪烁切换
- 可调整大小的面板布局，具有持久状态

### 📤 导出与分享

- 将整个对话树导出为交互式 HTML 文件
- 保留对话结构和格式
- 可离线工作的独立文件

## 🚀 快速开始

### 前置要求

- Node.js 22 或更高版本
- PostgreSQL 数据库
- OpenAI API 密钥（或兼容提供商的 API 密钥）
- **可选：** Docker 和 Docker Compose 用于本地 AI 模型

> **注意**：此应用程序支持任何具有 OpenAI 兼容 API 端点的 AI 提供商。所有提供商必须使用标准的 `Authorization: Bearer <api-key>` 头格式进行身份验证。

### 安装

1. **克隆仓库**

    ```bash
    git clone https://github.com/WASD2HJKL/Non-Linear-Chatbot.git
    cd Non-Linear-Chatbot
    ```

2. **设置环境变量**

    ```bash
    cp .env.server.example .env.server
    ```

    编辑 `.env.server` 并添加您的配置：

    ```env
    # AI 提供商 API 密钥（基于约定的命名）
    OPENAI_API_KEY=your_openai_api_key_here
    GEMINI_API_KEY=your_gemini_api_key_here
    HUGGINGFACE_API_KEY=hf_your_huggingface_token_here

    # 可选：Google OAuth
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    ```

3. **启动开发服务器**

    ```bash
    wasp start
    ```

4. **访问应用程序**

    在浏览器中打开 http://localhost:3000

### 本地 AI 模型（仅限开发环境）

用于使用本地 AI 模型而非云 API 进行开发：

📖 **查看 [LOCAL_SETUP.md](./LOCAL_SETUP.md)** 获取完整的设置说明

**使用 Docker 快速开始：**

```bash
# 启动本地 Ollama 服务
cd docker/local-models
docker-compose up -d

# 下载 phi3-mini 模型
docker-compose exec ollama ollama pull phi3:mini

# 添加到 .env.server
echo "OLLAMA_API_KEY=local-dummy-key" >> .env.server
```

> ⚠️ **仅限开发环境：** 本地 AI 模型仅用于开发环境。生产部署使用云提供商。

### 生产构建

```bash
wasp build
```

构建输出将位于：

- 前端：`.wasp/build/web-app/`
- 后端：`.wasp/build/server/`

## 🏗️ 架构

### 项目结构

```
Non-Linear-Chatbot/
├── main.wasp              # Wasp 配置和路由
├── schema.prisma          # 数据库模式
├── src/
│   ├── components/        # React 组件
│   ├── contexts/          # React 上下文（主题等）
│   ├── hooks/             # 自定义 React 钩子
│   ├── server/
│   │   ├── actions/       # 服务器端变更
│   │   ├── queries/       # 服务器端查询
│   │   ├── middleware/    # Express 中间件
│   │   └── openaiStream.ts # 多提供商 AI 流式端点
│   ├── services/          # 业务逻辑服务
│   ├── styles/            # CSS 文件
│   └── utils/             # 实用函数
└── public/                # 静态资源
```

### 关键设计模式

- **基于节点的对话存储**：每个消息对是树中的一个节点
- **多提供商 AI 架构**：支持 OpenAI 兼容 API 的统一客户端工厂
- **集中式存储服务**：具有迁移支持的一致 localStorage 处理
- **基于队列的流式传输**：防止数据丢失的强大 NDJSON 解析
- **组件模块化**：具有明确关注点分离的可重用 UI 组件
- **错误规范化**：跨不同 AI 提供商的标准化错误处理

## ⚙️ 提供商配置

应用程序通过统一的配置系统支持多个 AI 提供商。所有提供商必须支持 OpenAI 兼容的 API 端点。

### 添加新的提供商

编辑 `src/config.js` 以添加新的提供商：

```javascript
providers: [
    {
        id: "openai",
        name: "OpenAI",
        url: "https://api.openai.com/v1",
        timeout: 30000,
        retries: 3,
        models: [
            { id: "gpt-4o", name: "GPT-4o" },
            { id: "gpt-4.1", name: "GPT-4.1" },
            { id: "gpt-5-chat-latest", name: "GPT-5 Chat" },
            { id: "gpt-4o-mini", name: "GPT-4o Mini" },
            { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
            { id: "gpt-4.1-nano", name: "GPT-4.1 Nano" },
            { id: "gpt-5", name: "GPT-5 (Thinking)" },
            { id: "gpt-5-mini", name: "GPT-5 Mini" },
            { id: "o4-mini", name: "O4 Mini" },
        ],
    },
    {
        id: "huggingface",
        name: "Hugging Face",
        url: "https://router.huggingface.co/v1",
        timeout: 30000,
        retries: 3,
        models: [
            { id: "deepseek-ai/DeepSeek-R1:together", name: "DeepSeek R1" },
            { id: "meta-llama/Llama-3.2-90B-Vision-Instruct", name: "Llama 3.2 90B Vision" },
        ],
    },
];
```

### 要求

- **API 兼容性**：必须支持 OpenAI 的聊天完成 API 格式
- **身份验证**：必须使用 `Authorization: Bearer <api-key>` 头格式
- **流式传输**：必须支持服务器发送事件以实现实时响应
- **错误格式**：错误将自动规范化为标准格式

### API 密钥配置

应用程序使用基于约定的 API 密钥系统：

**约定**：`{PROVIDER_ID}_API_KEY`

示例：

- OpenAI：`OPENAI_API_KEY=sk-your_key_here`
- Gemini：`GEMINI_API_KEY=your_gemini_key_here`
- Hugging Face：`HUGGINGFACE_API_KEY=hf_your_token_here`

**向后兼容性**：如果找不到特定于提供商的密钥，系统将回退到 `OPENAI_API_KEY`。这确保现有设置无需更改即可继续工作。

## 🌐 部署

### 后端 (Heroku)

该项目包含用于 Heroku 部署的 Docker 配置：

```bash
heroku create your-app-name
heroku addons:create --app your-app-name heroku-postgresql:mini # 可选，如果您想使用 Heroku 数据库
                                                                # 否则您需要设置 DATABASE_URL 环境变量
heroku config:set --app your-app-name OPENAI_API_KEY=sk-xxx     # 对其他环境变量执行相同操作
```

### 前端 (Netlify)

要将前端构建部署到 Netlify，请在 `Netlify` 手动创建项目并设置 GitHub Actions 密钥，然后运行管道。

### GitHub Actions CI/CD

仓库包含自动化部署工作流，它会：

- 在推送到 main 时构建和测试
- 将后端部署到 Heroku
- 将前端部署到 Netlify

所需的 GitHub Secrets：

- `HEROKU_API_KEY`
- `HEROKU_APP_NAME`
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_NAME`
- `WASP_SERVER_URL`
- `WASP_WEB_CLIENT_URL`

## 🛠️ 开发

### 数据库迁移

```bash
wasp db migrate-dev    # 应用迁移
wasp db studio         # 打开 Prisma Studio
```

### 代码风格

项目使用 Prettier 进行代码格式化：

- Tab 宽度：4 个空格
- 打印宽度：120 个字符

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

1. Fork 仓库
2. 创建您的功能分支（`git checkout -b feature/AmazingFeature`）
3. 提交您的更改（`git commit -m 'feat: add some AmazingFeature'`）
4. 推送到分支（`git push origin feature/AmazingFeature`）
5. 打开 Pull Request

### 提交规范

本项目遵循约定式提交：

- `feat:` 新功能
- `fix:` 错误修复
- `docs:` 文档更改
- `style:` 代码风格更改
- `refactor:` 代码重构
- `test:` 测试添加/更改
- `chore:` 构建过程或辅助工具更改

## 📝 许可证

本项目基于 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 特别感谢 Zhiyuan Shao (<shao.zhiyu@northeastern.edu>)，他激发了思维导图的想法。

## 📧 联系方式

项目链接：[https://github.com/WASD2HJKL/Non-Linear-Chatbot](https://github.com/WASD2HJKL/Non-Linear-Chatbot)
