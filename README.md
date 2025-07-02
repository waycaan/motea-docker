# motea

# 念念不忘，必有回响。

本项目基于优秀的开源项目 [Notea](https://github.com/notea-org/notea)，遵循其 MIT 协议。我在原有架构基础上进行了一系列优化与调整，使其更适合部署在 [Vercel](https://vercel.com) 平台上，特别是结合 [Neon](https://neon.tech) 提供的 PostgreSQL 数据库服务。

## [✈️B站应用展示](https://www.bilibili.com/video/BV1KcTLzWENe/?vd_source=441079f1b64b3a1b4c28abe897343608)

## 🌟 项目亮点

- ✍️ 替换编辑器为 [Tiptap](https://tiptap.dev)，提供所见即所得的编辑体验；
- 🧠 新的编辑器采用新的 `/` 快捷语法调用与 **右键**  Markdown 浮动菜单支持；
- ♻️ 改用postgresql作为数据库，并重构后端大部分的处理逻辑和设定，更高效更稳定。
- 💾 修改为手动保存模式，快捷键为ctrl+s，以及添加边际情况的自动保存处理；
- ⚙️ 针对编辑器与保存机制重构上传/加载逻辑，减少函数调用，提升性能；
- 🧱 保留无边界的笔记页面结构；
- 🔐 延续原项目的加密认证与权限控制逻辑；
- 🔁 保留笔记管理与共享机制；
- 🖼️ 去除本地图片上传，采用 Markdown 图片链接渲染方式，编辑体验更接近 Typora；
- 📦 如需图床支持，可参考我的另一个原创项目 [Mazine](https://github.com/waycaan/mazine)。

## 🚀 部署方式（推荐 Vercel + Neon）

> 为获得最佳体验，请使用 **Neon 数据库 Washington, D.C., USA (East)** 区域节点。因大部分用户使用 Vercel 免费计划（主机位于美国），使用该节点可获得最低延迟。

[数据库生成教学](/doc/neon.md)

---

### 1. Fork 本项目

点击右上角 `Fork`，将项目复制到你的 GitHub 账户下。

### 2. 导入至 Vercel

登录 [Vercel](https://vercel.com)，点击 `Import Project`，选择刚刚 Fork 的仓库。

### 3. 设置环境变量

在 Vercel 项目的 `Settings > Environment Variables` 页面，添加以下变量：

| 变量名              | 示例值或说明                      |
|---------------------|----------------------------------|
| `DATABASE_URL`      | [数据库生成教学](/doc/neon.md) |
| `PASSWORD`          | 登录密码（任意设置）            |
| `PRELOAD_NOTES_COUNT` | `10`（预加载笔记条数）        |

### 4. 部署

点击 `Deploy` 开始部署，初次部署大约需 **2 分钟**。完成后即可访问。

---

## docker部署

### 下载`docker-compose.yml`到你指定的文件夹中，修改几个参数,仅支持X86和arm64。

password=motea

PRELOAD_NOTES_COUNT=10  //也可以不改，反正容器的速度快，才几个K的传输

COOKIE_SECURE=false //局域网就维持这个false吧。

### 部署成功后有SSL证书，必须修改，因为依赖的验证与这2个相关。

COOKIE_SECURE=true

BASE_URL=http://localhost:3000 这里修改为你网页

---

计划
增加docker本地部署。所以你看到部分代码和config文件中存在supabase和自建postgresql的选项。

## 📝 协议

本项目基于 [Notea](https://github.com/notea-org/notea) 开源项目开发，遵循其 MIT License。原始版权声明已保留，感谢原作者的开源贡献。

---
- 虽然原项目弃坑了，但一直都想复活它。无它，就因为它优雅。
- 但又觉得本身基于S3作为存储是错误的选择，毕竟S3文件本身就不太支持重复修改，尤其是文件重命名对S3要求很高，而且各个对象存储版本都可能存在不统一的情况。所以我选择不向原项目提交 PR，而是直接进行独立改写与重构。
- 本项目所有修改思路为个人原创设计，有使用AI协助编程，实在是存在个人水平达不到的高度。
- 本来打算叫newnotea，不优雅，还是改为Motea算了，里面图标都不改了，致敬原创，致敬我的青春！
