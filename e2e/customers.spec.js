const { test, expect } = require("@playwright/test");

const API_URL = process.env.API_URL || "http://localhost:8000";

test("新增、编辑、删除客户", async ({ page }) => {
  // config.js 只在 window.CRM_API_BASE 为空时才用默认值，所以在页面脚本运行前注入后端地址即可。
  await page.addInitScript((api) => { globalThis.CRM_API_BASE = api; }, API_URL);
  await page.goto("/");

  // 每次运行用不同的名字，避免和库里已有的数据混淆
  const name = `E2E 客户 ${Date.now()}`;
  const row = page.locator("#customer-rows tr", { hasText: name });

  // 新增
  await page.getByPlaceholder("姓名 *").fill(name);
  await page.getByPlaceholder("公司").fill("Acme");
  await page.getByRole("button", { name: "新增客户" }).click();
  await expect(page.locator("#message")).toHaveText("已新增");
  await expect(row).toContainText("Acme");

  // 编辑
  await row.getByRole("button", { name: "编辑" }).click();
  await page.getByPlaceholder("公司").fill("Globex");
  await page.getByRole("button", { name: "保存修改" }).click();
  await expect(page.locator("#message")).toHaveText("已保存");
  await expect(row).toContainText("Globex");

  // 删除（页面会弹 confirm 确认框，这里自动点确定）
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "删除" }).click();
  await expect(page.locator("#message")).toHaveText("已删除");
  await expect(row).toHaveCount(0);
});
