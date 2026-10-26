from typing import Annotated

import dagger
from dagger import DefaultPath, Doc, Ignore, dag, function, object_type

SOURCE_IGNORE = [".git", ".dagger", "node_modules", "test-results", "playwright-report"]

# 后端仓库：end-to-end 默认拉它 main 分支的代码，用它自己的 Dockerfile 构建并启动。
SERVER_REPO = "https://github.com/zoulingang/devops-test-server"

# 与 package.json 里 @playwright/test 的版本保持一致，镜像里已装好浏览器。
PLAYWRIGHT_IMAGE = "mcr.microsoft.com/playwright:v1.64.0-noble"

# 可选参数：国内网络下本地运行时，用它把 npm 指向国内镜像源。默认为空，即使用官方 registry。
NpmRegistry = Annotated[
    str,
    Doc("npm 镜像源地址，例如 https://registry.npmmirror.com ；留空则用官方 registry"),
]

ServerDir = Annotated[
    dagger.Directory | None,
    Doc("后端代码目录，例如 ../devops-test-server ；不传则用 devops-test-server 仓库的 main 分支"),
]


@object_type
class DevopsTestWeb:
    def node(self, npm_registry: str) -> dagger.Container:
        """node:22-slim 基础容器；传了镜像源就设置 npm_config_registry。"""
        ctr = dag.container().from_("node:22-slim")
        if npm_registry:
            ctr = ctr.with_env_variable("npm_config_registry", npm_registry)
        return ctr

    @function
    async def lint(
        self,
        source: Annotated[dagger.Directory, DefaultPath("/"), Ignore(SOURCE_IGNORE)],
        npm_registry: NpmRegistry = "",
    ) -> str:
        """静态检查：npm ci 安装 eslint，再运行 npm run lint（规则在 eslint.config.js）。

        先只拷 package.json 和 lock 文件并安装，再拷其余代码：只改代码、不改依赖时，npm ci 能命中缓存。
        """
        return await (
            self.node(npm_registry)
            .with_workdir("/app")
            .with_file("/app/package.json", source.file("package.json"))
            .with_file("/app/package-lock.json", source.file("package-lock.json"))
            .with_exec(["npm", "ci"])
            .with_directory("/app", source)
            .with_exec(["npm", "run", "lint"])
            .stdout()
        )

    @function
    async def test(
        self,
        source: Annotated[dagger.Directory, DefaultPath("/"), Ignore(SOURCE_IGNORE)],
    ) -> str:
        """在 node:22-slim 容器里运行 npm test（单元测试不依赖 npm 包，无需 npm install）。"""
        return await (
            dag.container()
            .from_("node:22-slim")
            .with_directory("/app", source)
            .with_workdir("/app")
            .with_exec(["npm", "test"])
            .stdout()
        )

    def e2e_run(
        self, source: dagger.Directory, server: dagger.Directory | None, npm_registry: str
    ) -> dagger.Container:
        """启动后端和前端，在 Playwright 容器里跑 E2E；测试失败也不报错，返回跑完的容器。

        后端（api:8000）和前端（web:80）都是 Dagger service，用各自仓库的 Dockerfile 构建；
        测试容器通过服务名访问它们，浏览器发出的 API 请求也直接打到 http://api:8000 。
        end_to_end 和 end_to_end_report 共用这一步，输入相同时 Dagger 会命中缓存，测试只跑一次。
        """
        if server is None:
            server = dag.git(SERVER_REPO).branch("main").tree()

        api = server.docker_build().with_exposed_port(8000).as_service()
        web = source.docker_build().with_exposed_port(80).as_service()

        ctr = dag.container().from_(PLAYWRIGHT_IMAGE)
        if npm_registry:
            ctr = ctr.with_env_variable("npm_config_registry", npm_registry)
        return (
            ctr.with_workdir("/app")
            .with_file("/app/package.json", source.file("package.json"))
            .with_file("/app/package-lock.json", source.file("package-lock.json"))
            .with_exec(["npm", "ci"])
            .with_directory("/app", source)
            .with_service_binding("api", api)
            .with_service_binding("web", web)
            .with_env_variable("API_URL", "http://api:8000")
            .with_env_variable("BASE_URL", "http://web")
            # expect=ANY：测试失败（退出码非 0）时也继续，这样失败的报告和截图也能导出来
            .with_exec(["npm", "run", "e2e"], expect=dagger.ReturnType.ANY)
        )

    @function
    async def end_to_end(
        self,
        source: Annotated[dagger.Directory, DefaultPath("/"), Ignore(SOURCE_IGNORE)],
        server: ServerDir = None,
        npm_registry: NpmRegistry = "",
    ) -> str:
        """端到端测试：同时启动后端和前端，再用 Playwright 在浏览器里新增、编辑、删除客户。

        返回测试输出；有用例失败时函数报错（CI 里这一步变红）。想看截图报告用 end-to-end-report。
        """
        ctr = self.e2e_run(source, server, npm_registry)
        output = await ctr.stdout()
        if await ctr.exit_code() != 0:
            raise RuntimeError(f"E2E 测试失败\n{output}\n{await ctr.stderr()}")
        return output

    @function
    def end_to_end_report(
        self,
        source: Annotated[dagger.Directory, DefaultPath("/"), Ignore(SOURCE_IGNORE)],
        server: ServerDir = None,
        npm_registry: NpmRegistry = "",
    ) -> dagger.Directory:
        """跑 E2E 并返回 Playwright HTML 报告目录（含每个用例的截图和通过/失败结果）。

        测试失败时也会返回报告。导出到本地：
        dagger call end-to-end-report export --path=./playwright-report
        """
        return self.e2e_run(source, server, npm_registry).directory("/app/playwright-report")
