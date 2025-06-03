# motea

# 念念不忘，必有回响。

本项目基于优秀的开源项目 [Notea](https://github.com/notea-org/notea)，遵循其 MIT 协议。我在原有架构基础上进行了一系列优化与调整，使其更适合部署在 [Vercel](https://vercel.com) 平台上，特别是结合 [Neon](https://neon.tech) 提供的 PostgreSQL 数据库服务。

## 🌟 项目亮点

- ✍️ 替换编辑器为 [Tiptap](https://tiptap.dev)，提供所见即所得的编辑体验；
- 🧠 新的编辑器依然保留 `/` 快捷语法调用与 **右键**  Markdown 浮动菜单支持；
- 💾 修改为手动保存模式；
- ⚙️ 针对编辑器与保存机制重构上传/加载逻辑，减少函数调用，提升性能；
- 🧱 保留无边界的笔记页面结构；
- 🔐 延续原项目的加密认证与权限控制逻辑；
- 🔁 保留笔记管理与共享机制；
- 🖼️ 去除本地图片上传，采用 Markdown 图片链接渲染方式，编辑体验更接近 Typora；
- 📦 如需图床支持，可参考我的另一个原创项目 [Mazine](https://github.com/waycaan/mazine)。

## 🚀 部署方式

### 方式一：Vercel + Neon（推荐）

> 为获得最佳体验，请使用 **Neon 数据库 Washington, D.C., USA (East)** 区域节点。因大部分用户使用 Vercel 免费计划（主机位于美国），使用该节点可获得最低延迟。

#### 1. Fork 本项目

点击右上角 `Fork`，将项目复制到你的 GitHub 账户下。

#### 2. 导入至 Vercel

登录 [Vercel](https://vercel.com)，点击 `Import Project`，选择刚刚 Fork 的仓库。

#### 3. 设置环境变量

在 Vercel 项目的 `Settings > Environment Variables` 页面，添加以下变量：

| 变量名              | 示例值或说明                      |
|---------------------|----------------------------------|
| `DATABASE_URL`      | Neon 提供的 PostgreSQL 连接地址 |
| `PASSWORD`          | 登录密码（任意设置）            |
| `PRELOAD_NOTES_COUNT` | `10`（预加载笔记条数）        |

#### 4. 部署

点击 `Deploy` 开始部署，初次部署大约需 **2 分钟**。完成后即可访问。

### 方式二：Docker 部署 🐳

支持 X86_64 和 ARM64 架构，适合自建服务器或本地开发。

#### 快速开始

```bash
# 使用预构建镜像
docker run -d \
  --name motea \
  -p 3000:3000 \
  -e DATABASE_URL="your_database_url" \
  -e PASSWORD="your_password" \
  ghcr.io/your-username/notea/motea:latest
```

#### 使用 Docker Compose（推荐）

```bash
# 1. 复制环境变量文件
cp .env.example .env.local

# 2. 编辑配置文件
# 编辑 .env.local 设置数据库和认证信息

# 3. 启动服务
docker-compose up -d

# 4. 访问应用
# http://localhost:3000
```

#### 本地构建

```bash
# 构建镜像
make build

# 运行容器
make run

# 查看日志
make logs

# 停止服务
make stop
```

详细的 Docker 部署说明请参考 [DOCKER.md](./DOCKER.md)。

## ⚙️ 配置管理

motea 提供了强大的配置管理工具，支持多种数据库提供商：

### 自动配置（推荐）

```bash
# 交互式配置设置
node scripts/config-manager.js

# Windows PowerShell
.\scripts\config-manager.ps1

# 或使用 Makefile
make config-setup
```

### 快速配置

```bash
# Neon PostgreSQL（推荐用于 Vercel）
make config-neon

# Supabase PostgreSQL
make config-supabase

# 自建 PostgreSQL
make config-self-hosted
```

### 配置验证

```bash
# 验证当前配置
make config-validate
```

### 支持的数据库

- **Neon PostgreSQL** - 无服务器，推荐用于生产环境
- **Supabase PostgreSQL** - 功能丰富的后端服务
- **自建 PostgreSQL** - 完全控制，适合本地开发

详细的配置说明请参考 [CONFIG.md](./CONFIG.md)。

## 📝 协议

本项目基于 [Notea](https://github.com/notea-org/notea) 开源项目开发，遵循其 MIT License。原始版权声明已完整保留，感谢原作者的开源贡献。

---
- 虽然原项目弃坑了，但一直都想复活它。无它，就因为它优雅。
- 但又觉得本身基于S3作为存储是错误的选择，毕竟S3文件本身就不太支持重复修改，尤其是文件重命名对S3要求很高，而且各个对象存储版本都可能存在不统一的情况。所以我选择不向原项目提交 PR，而是直接进行独立改写与重构。
- 本项目所有修改思路为个人原创设计，有使用AI协助编程，实在是存在个人水平达不到的高度。
- 本来打算叫newnotea，不优雅，还是改为Motea算了，里面图标都不改了，致敬原创，致敬我的青春！
