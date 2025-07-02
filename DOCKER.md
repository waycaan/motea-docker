# Docker 部署指南

本文档介绍如何使用 Docker 部署 motea 应用。

## 🐳 快速开始

### 使用预构建镜像

```bash
# 拉取最新镜像
docker pull ghcr.io/your-username/notea/motea:latest

# 运行容器
docker run -d \
  --name motea \
  -p 3000:3000 \
  -e DATABASE_URL="your_database_url" \
  -e PASSWORD="your_password" \
  ghcr.io/your-username/notea/motea:latest
```

### 使用 Docker Compose（推荐）

1. 复制环境变量文件：
```bash
cp .env.example .env.local
```

2. 编辑 `.env.local` 文件，配置数据库和认证信息

3. 启动服务：
```bash
docker-compose up -d
```

4. 访问应用：http://localhost:3000

## 🔧 配置说明

### 环境变量

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `DATABASE_URL` | ✅ | - | PostgreSQL 数据库连接字符串 |
| `PASSWORD` | ❌ | - | 应用访问密码 |
| `DISABLE_PASSWORD` | ❌ | false | 禁用密码保护 |
| `NODE_ENV` | ❌ | production | 运行环境 |
| `PORT` | ❌ | 3000 | 应用端口 |

### 数据库配置示例

#### Neon PostgreSQL（推荐）
```bash
DATABASE_URL=postgres://username:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
```

#### Supabase PostgreSQL
```bash
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

#### 本地 PostgreSQL
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/motea
```

## 🏗️ 构建镜像

### 本地构建

```bash
# 构建镜像
docker build -t motea:local .

# 运行本地构建的镜像
docker run -d --name motea -p 3000:3000 motea:local
```

### 多架构构建

```bash
# 设置 buildx
docker buildx create --use

# 构建多架构镜像
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag motea:multi-arch \
  --push .
```

## 🔍 健康检查

容器包含内置的健康检查功能：

```bash
# 检查容器健康状态
docker ps

# 查看健康检查日志
docker inspect motea | grep -A 10 Health

# 手动测试健康端点
curl http://localhost:3000/api/health
```

## 📊 监控和日志

### 查看日志
```bash
# 查看实时日志
docker logs -f motea

# 查看最近的日志
docker logs --tail 100 motea
```

### 容器统计
```bash
# 查看资源使用情况
docker stats motea
```

## 🔄 更新和维护

### 更新应用
```bash
# 拉取最新镜像
docker pull ghcr.io/your-username/notea/motea:latest

# 停止并删除旧容器
docker stop motea && docker rm motea

# 启动新容器
docker run -d \
  --name motea \
  -p 3000:3000 \
  --env-file .env.local \
  ghcr.io/your-username/notea/motea:latest
```

### 数据备份
```bash
# 如果使用 Docker Compose 中的 PostgreSQL
docker exec postgres pg_dump -U postgres motea > backup.sql
```

## 🚨 故障排除

### 常见问题

1. **容器无法启动**
   - 检查环境变量配置
   - 确认数据库连接字符串正确
   - 查看容器日志：`docker logs motea`

2. **数据库连接失败**
   - 验证 `DATABASE_URL` 格式
   - 确认数据库服务可访问
   - 检查防火墙设置

3. **端口冲突**
   - 修改端口映射：`-p 8080:3000`
   - 检查端口占用：`netstat -tulpn | grep 3000`

### 调试模式

```bash
# 以交互模式运行容器进行调试
docker run -it --rm \
  --entrypoint /bin/sh \
  ghcr.io/your-username/notea/motea:latest
```

## 📝 注意事项

- 容器以非 root 用户运行，提高安全性
- 支持 X86_64 和 ARM64 架构
- 包含自动重启和健康检查功能
- 生产环境建议使用外部 PostgreSQL 数据库

## 🤝 贡献

如有问题或建议，请提交 Issue 或 Pull Request。

---

**基于开源项目 Notea，由 qingwei-li<cinwell.li@gmail.com> 原创。由 waycaan 修改和维护，2025。**
