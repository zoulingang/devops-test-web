# AGENTS.md

本文件是写给 AI 编码 Agent 的项目说明（[AGENTS.md 约定](https://agents.md/)）。面向人的介绍见 README.md，这里只写 Agent 动手前必须知道的事。

## 项目概况

- 极简 CRM 前端，**用于学习 CI/CD 和 E2E（基于 Dagger）**。保持最小：不要引入框架、打包工具、TypeScript 或运行时 npm 依赖，也不要主动加新的 CI 阶段或部署流程，除非用户明确要求。
- 纯 HTML + 原生 JavaScript，无构建步骤。`src/` 下的文件就是线上文件，Docker 镜像用 nginx 直接托管 `src/`。
- 后端在另一个仓库 [devops-test-server](https://github.com/zoulingang/devops-test-server)（FastAPI，默认 `http://localhost:8000`）。

## 代码结构要点

- `src/index.html` 用 `<script>` 按顺序加载 `config.js` → `lib.js` → `app.js`，三个文件**共享全局作用域**，不是 ES 模块。不要改成 `import`/`export`。
- `src/lib.js`：纯函数（表单转换、校验、转义），末尾用 `if (typeof module !== "undefined") module.exports = …` 导出给 Node 测试用。可测的逻辑放这里。
- `src/app.js`：DOM 和 `fetch` 调用，没有单元测试，靠 E2E 覆盖。
- `src/config.js`：后端地址 `window.CRM_API_BASE`，已设置时不会覆盖（E2E 靠这一点注入地址）。

## 常用命令

```bash
npm ci              # 安装开发依赖（eslint、Playwright），页面本身不需要
npm test            # 单元测试：node --test tests/*.test.js
npm run lint        # eslint（规则在 eslint.config.js）
npm start           # 本地静态服务 http://localhost:5173
npm run e2e         # Playwright E2E，需要后端在 8000、前端在 5173 已启动，并已执行 npx playwright install chromium
```

CI 跑的是 Dagger 函数，本地有 Dagger CLI（v0.21.11）和 Docker 时可以跑同样的命令：

```bash
dagger call lint
dagger call test
dagger call end-to-end                                              # 自动拉后端 main 并启动前后端
dagger call end-to-end --server=../devops-test-server               # 用本地后端代码
dagger call end-to-end-report export --path=./playwright-report     # 导出带截图的 HTML 报告
```

## 提交前必须通过

1. `npm run lint` 无报错
2. `npm test` 全部通过
3. 改了页面文字、表单、按钮、`src/app.js` 或 E2E 本身时，E2E 也要通过

## E2E 的约束

- 用例在 `e2e/customers.spec.js`：新增、编辑、删除客户三个独立用例。编辑和删除用例先通过 API 准备数据。
- 用例按**界面上的中文文字**定位元素：占位符「姓名 *」「公司」，按钮「新增客户」「编辑」「保存修改」「删除」，提示「已新增」「已保存」「已删除」，以及 `#customer-rows`、`#message`。改这些文字或 id 时，要同步改用例。
- **这份用例也是后端仓库的 E2E**：后端 CI 运行 `dagger call -m github.com/zoulingang/devops-test-web@main end-to-end --server=.`。所以：
  - 不要重命名 `end_to_end` / `end_to_end_report` 函数，不要删除或改名 `server`、`source` 参数，否则后端 CI 会失败。
  - 用例只能依赖后端已有的 API。依赖后端新接口的用例，要等后端改动先合入 main。
- `@playwright/test` 的版本必须和 `.dagger/src/devops_test_web/main.py` 里 `PLAYWRIGHT_IMAGE` 的版本一致（现在都是 1.64.0），升级时两处一起改。
- 报告和截图输出到 `playwright-report/` 和 `test-results/`，都已被 git 忽略，不要提交。

## CI 和 Dagger

- `.github/workflows/ci.yml` 有三个并行 job：`lint`、`test`、`end-to-end`。`end-to-end` 先导出报告并上传为 artifact `playwright-report`（失败也上传），再用 `dagger call end-to-end` 判定成败。两次调用输入相同，靠 Dagger 缓存只跑一次测试。
- Dagger 模块在 `.dagger/src/devops_test_web/main.py`。函数名不要带数字（Dagger CLI 会把 `e2e` 变成 `e-2-e`）。
- 安装依赖的步骤放在拷贝源码之前，这样只改代码时能命中缓存。新增函数时保持这个顺序。
- Dagger 版本 0.21.11 同时写在 `dagger.json` 和 `ci.yml` 里，升级时一起改。
- `--npm-registry` 参数只是为国内网络准备的，CI 里不要传。

## 约定

- 文档、注释、提交说明、界面文字用中文；代码标识符用英文。
- 在分支上开发并提 PR，不要直接推 main。
- `package.json` 里的依赖用精确版本号，改依赖后提交更新过的 `package-lock.json`。
