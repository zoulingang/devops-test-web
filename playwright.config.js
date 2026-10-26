const { defineConfig, devices } = require("@playwright/test");

// 前端和后端地址由环境变量传入：Dagger 的 end-to-end 函数里是 http://web 和 http://api:8000。
module.exports = defineConfig({
  testDir: "e2e",
  // list：在终端逐条打印用例结果；html：生成带截图的报告到 playwright-report/（不自动打开浏览器）
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    // 每个用例结束时都截一张图（不论通过或失败），失败时额外保留 trace 方便排查
    screenshot: "on",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
});
