from typing import Annotated

import dagger
from dagger import DefaultPath, Doc, Ignore, dag, function, object_type

SOURCE_IGNORE = [".git", ".dagger", "node_modules"]

# 可选参数：国内网络下本地运行时，用它把 npm 指向国内镜像源。默认为空，即使用官方 registry。
NpmRegistry = Annotated[
    str,
    Doc("npm 镜像源地址，例如 https://registry.npmmirror.com ；留空则用官方 registry"),
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
