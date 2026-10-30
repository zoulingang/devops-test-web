const { test, expect } = require("@playwright/test");

const API_URL = process.env.API_URL || "http://localhost:8000";

// 三个用例各自独立：编辑和删除用例先通过 API 准备一条客户数据，再在页面上操作。
// 每个用例结束时 Playwright 会自动截一张图（见 playwright.config.js 的 screenshot: "on"），
// 截图和通过/失败结果都在 HTML 报告里。

test.beforeEach(async ({ page }) => {
  // config.js 只在 window.CRM_API_BASE 为空时才用默认值，所以在页面脚本运行前注入后端地址即可。
  await page.addInitScript((api) => { globalThis.CRM_API_BASE = api; }, API_URL);
});

// 每次运行用不同的名字，避免和库里已有的数据混淆
function uniqueName() {
  return `E2E 客户 ${Date.now()}`;
}

async function createCustomer(request, data) {
  const res = await request.post(`${API_URL}/api/customers`, { data });
  expect(res.status()).toBe(201);
  return res.json();
}

test("新增客户", async ({ page }) => {
  const name = uniqueName();
  const row = page.locator("#customer-rows tr", { hasText: name });
  await page.goto("/");

  await page.getByPlaceholder("姓名 *").fill(name);
  await page.getByPlaceholder("公司").fill("Acme");
  await page.getByRole("button", { name: "新增客户" }).click();

  await expect(page.locator("#message")).toHaveText("已新增");
  await expect(row).toContainText("Acme");
});

test("编辑客户", async ({ page, request }) => {
  const name = uniqueName();
  await createCustomer(request, { name, company: "Acme" });
  const row = page.locator("#customer-rows tr", { hasText: name });
  await page.goto("/");

  await row.getByRole("button", { name: "编辑" }).click();
  await page.getByPlaceholder("公司").fill("Globex");
  await page.getByRole("button", { name: "保存修改" }).click();

  await expect(page.locator("#message")).toHaveText("已保存");
  await expect(row).toContainText("Globex");
});

test("删除客户", async ({ page, request }) => {
  const name = uniqueName();
  await createCustomer(request, { name, company: "Acme" });
  const row = page.locator("#customer-rows tr", { hasText: name });
  await page.goto("/");
  await expect(row).toHaveCount(1);

  // 页面会弹 confirm 确认框，这里自动点确定
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "删除" }).click();

  await expect(page.locator("#message")).toHaveText("已删除");
  await expect(row).toHaveCount(0);
});

test("切换夜间模式并刷新保留", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("radio", { name: "夜间模式" }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("radio", { name: "夜间模式" })).toBeChecked();

  await page.reload();

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("radio", { name: "夜间模式" })).toBeChecked();

  await page.getByRole("radio", { name: "亮色模式" }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("切换主题时保留正在填写的表单内容", async ({ page }) => {
  await page.goto("/");

  await page.getByPlaceholder("姓名 *").fill("夜间模式验收客户");
  await page.getByPlaceholder("公司").fill("Acme");

  await page.getByRole("radio", { name: "夜间模式" }).check();

  await expect(page.getByPlaceholder("姓名 *")).toHaveValue("夜间模式验收客户");
  await expect(page.getByPlaceholder("公司")).toHaveValue("Acme");
});
