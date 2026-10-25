# devops-test-web

极简 CRM 前端，用于学习 DevOps / CI/CD。后端在 [devops-test-server](https://github.com/zoulingang/devops-test-server)。

- 纯 HTML + 原生 JavaScript，**无框架、无构建步骤、无 npm 依赖**
- 功能：客户列表、新增、编辑、删除
- 无鉴权

## 目录

```
src/
  index.html   页面
  app.js       页面逻辑（调用后端 API）
  lib.js       纯函数（表单处理、校验、转义），有单元测试
  config.js    后端地址，默认 http://localhost:8000
  style.css
tests/         Node 内置 test runner 的单元测试
```

## 本地运行

1. 先启动后端（见 devops-test-server 的 README），默认监听 `http://localhost:8000`。
2. 启动前端静态服务：

```bash
npm start            # 等价于 python3 -m http.server 5173 --directory src
```

3. 打开 http://localhost:5173

后端地址不同的话，修改 `src/config.js` 里的 `CRM_API_BASE`。

## 测试

需要 Node.js 18+：

```bash
npm test
```

## CI（Dagger）

CI 流程写在 Dagger 模块里，本地和 GitHub Actions 跑的是同一条命令：

```bash
dagger call test
```

- `dagger.json`：模块声明（名字、Dagger 版本、用 Python SDK、代码在 `.dagger/`）
- `.dagger/src/devops_test_web/main.py`：唯一的函数 `test`，把代码放进 `node:22-slim` 容器运行 `npm test`（没有 npm 依赖，所以不需要 install）
- `.github/workflows/ci.yml`：在 PR 和 push 到 main 时运行 `dagger call test`

本地运行需要先安装 [Dagger CLI](https://docs.dagger.io/install)（v0.21.11）和 Docker。

## Docker

```bash
docker build -t crm-web .
docker run -p 8080:80 crm-web
```

然后打开 http://localhost:8080（后端仍需在 `http://localhost:8000` 运行）。
