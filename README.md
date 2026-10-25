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

## Docker

```bash
docker build -t crm-web .
docker run -p 8080:80 crm-web
```

然后打开 http://localhost:8080（后端仍需在 `http://localhost:8000` 运行）。
