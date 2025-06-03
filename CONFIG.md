# motea 配置指南

本文档详细介绍了 motea 的配置选项和数据库设置。

## 🚀 快速开始

### 自动配置（推荐）

使用配置管理器进行交互式设置：

```bash
# Node.js 版本
node scripts/config-manager.js

# PowerShell 版本（Windows）
.\scripts\config-manager.ps1
```

### 手动配置

1. 复制环境变量文件：
```bash
cp .env.example .env.local
```

2. 编辑 `.env.local` 文件，配置数据库和认证信息

3. 验证配置：
```bash
node scripts/validate-config.js
```

## 📊 支持的数据库提供商

### 1. Neon PostgreSQL（推荐用于生产环境）

**特点：**
- 无服务器 PostgreSQL
- 自动扩缩容
- 与 Vercel 完美集成
- 内置连接池

**配置示例：**
```bash
# 快速设置
make config-neon

# 或手动复制
cp config/env.neon.example .env.local
```

**连接字符串格式：**
```
postgres://username:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
```

### 2. Supabase PostgreSQL

**特点：**
- PostgreSQL + 额外后端服务
- 内置实时功能
- 自带认证系统（motea 不使用）
- 良好的开发者体验

**配置示例：**
```bash
# 快速设置
make config-supabase

# 或手动复制
cp config/env.supabase.example .env.local
```

**连接字符串格式：**
```
postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

### 3. 自建 PostgreSQL

**特点：**
- 完全控制
- 适合本地开发
- 可自定义性能调优
- 无供应商锁定

**配置示例：**
```bash
# 快速设置
make config-self-hosted

# 或手动复制
cp config/env.self-hosted.example .env.local
```

**连接字符串格式：**
```
postgresql://username:password@localhost:5432/motea
```

## ⚙️ 环境变量详解

### 必需变量

| 变量名 | 描述 | 示例 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgres://user:pass@host:5432/db` |

### 认证配置

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `PASSWORD` | 应用访问密码 | - |
| `DISABLE_PASSWORD` | 禁用密码保护 | `false` |

### 性能配置

| 变量名 | 描述 | 默认值 | 推荐值 |
|--------|------|--------|--------|
| `PRELOAD_NOTES_COUNT` | 预加载笔记数量 | `10` | `10-20` |
| `LOG_LEVEL` | 日志级别 | `info` | `info` |

### 可选配置

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `DB_PROVIDER` | 明确指定数据库提供商 | 自动检测 |
| `STORE_PREFIX` | 数据库表前缀 | - |
| `SESSION_SECRET` | 会话密钥 | 自动生成 |
| `COOKIE_SECURE` | 安全 Cookie | `true`（生产环境） |
| `BASE_URL` | 应用基础 URL | - |
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 应用端口 | `3000` |

## 🔧 配置工具

### 配置管理器

交互式配置设置：

```bash
# 启动配置管理器
make config-setup

# 或直接运行
node scripts/config-manager.js

# Windows PowerShell
.\scripts\config-manager.ps1
```

### 配置验证器

验证当前配置：

```bash
# 验证配置
make config-validate

# 或直接运行
node scripts/validate-config.js
```

### 快速配置命令

```bash
# Neon PostgreSQL
make config-neon

# Supabase PostgreSQL
make config-supabase

# 自建 PostgreSQL
make config-self-hosted
```

## 🐳 Docker 配置

### Docker Compose

使用 Docker Compose 进行本地开发：

```bash
# 1. 设置配置
make config-self-hosted

# 2. 启动服务
docker-compose up -d

# 3. 查看日志
make compose-logs
```

### 生产环境 Docker

```bash
# 构建镜像
make build

# 运行容器
docker run -d \
  --name motea \
  -p 3000:3000 \
  --env-file .env.local \
  motea:latest
```

## 🔍 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 验证配置
   make config-validate
   
   # 检查连接字符串格式
   # 确认数据库服务可访问
   ```

2. **认证问题**
   ```bash
   # 检查 PASSWORD 或 DISABLE_PASSWORD 设置
   # 确认只设置其中一个
   ```

3. **性能问题**
   ```bash
   # 调整 PRELOAD_NOTES_COUNT
   # 检查数据库连接池设置
   ```

### 调试模式

启用详细日志：

```bash
# 设置调试日志级别
LOG_LEVEL=debug

# 查看应用日志
npm run dev
```

## 📝 最佳实践

### 安全性

1. **使用强密码**：为数据库和应用设置强密码
2. **启用 SSL**：生产环境必须使用 SSL 连接
3. **定期更新**：保持依赖项和数据库版本最新
4. **环境隔离**：开发、测试、生产使用不同的数据库

### 性能优化

1. **选择合适的区域**：数据库和应用部署在同一区域
2. **连接池配置**：根据并发需求调整连接池大小
3. **预加载设置**：根据用户习惯调整预加载笔记数量
4. **监控指标**：定期检查数据库性能和连接数

### 部署建议

1. **Vercel + Neon**：推荐的生产环境组合
2. **Docker + 自建**：适合自托管场景
3. **开发环境**：使用 Docker Compose 本地开发
4. **备份策略**：定期备份数据库数据

## 🤝 获取帮助

如果遇到配置问题：

1. 运行配置验证器：`make config-validate`
2. 查看详细配置示例：`config/` 目录
3. 参考 Docker 部署指南：`DOCKER.md`
4. 提交 Issue 或查看文档

---

**基于开源项目 Notea，由 qingwei-li<cinwell.li@gmail.com> 原创。由 waycaan 修改和维护，2025。**
