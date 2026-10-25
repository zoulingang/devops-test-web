from typing import Annotated

import dagger
from dagger import DefaultPath, Ignore, dag, function, object_type


@object_type
class DevopsTestWeb:
    @function
    async def test(
        self,
        source: Annotated[
            dagger.Directory,
            DefaultPath("/"),
            Ignore([".git", ".dagger", "node_modules"]),
        ],
    ) -> str:
        """在 node:22-slim 容器里运行 npm test（项目没有 npm 依赖，无需 npm install）。"""
        return await (
            dag.container()
            .from_("node:22-slim")
            .with_directory("/app", source)
            .with_workdir("/app")
            .with_exec(["npm", "test"])
            .stdout()
        )
