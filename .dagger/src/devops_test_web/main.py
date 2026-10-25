from typing import Annotated

import dagger
from dagger import DefaultPath, Ignore, dag, function, object_type


@object_type
class DevopsTestWeb:
    @function
    async def lint(
        self,
        source: Annotated[
            dagger.Directory,
            DefaultPath("/"),
            Ignore([".git", ".dagger", "node_modules"]),
        ],
    ) -> str:
        """静态检查：npm ci 安装 eslint，再运行 npm run lint（规则在 eslint.config.js）。"""
        return await (
            dag.container()
            .from_("node:22-slim")
            .with_directory("/app", source)
            .with_workdir("/app")
            .with_exec(["npm", "ci"])
            .with_exec(["npm", "run", "lint"])
            .stdout()
        )

    @function
    async def test(
        self,
        source: Annotated[
            dagger.Directory,
            DefaultPath("/"),
            Ignore([".git", ".dagger", "node_modules"]),
        ],
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
