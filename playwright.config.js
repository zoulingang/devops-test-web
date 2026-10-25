const { defineConfig, devices } = require("@playwright/test");

// 前端和后端地址由环境变量传入：Dagger 的 e2e 函数里是 http://web 和 http://api:8000。
module.exports = defineConfig({
  testDir: "e2e",
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    ...devices["Desktop Chrome"],
  },
});
