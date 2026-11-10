const test = require("node:test");
const assert = require("node:assert");
const { DEFAULT_THEME, formToCustomer, validateCustomer, escapeHtml, normalizeTheme } = require("../src/lib.js");

test("formToCustomer trims values and turns blanks into null", () => {
  assert.deepStrictEqual(
    formToCustomer({ name: "  Alice ", email: "", phone: "123", company: " ", notes: undefined }),
    { name: "Alice", email: null, phone: "123", company: null, notes: null },
  );
});

test("validateCustomer requires a name", () => {
  assert.strictEqual(validateCustomer({ name: null }), "姓名不能为空");
  assert.strictEqual(validateCustomer({ name: "Bob" }), null);
});

test("validateCustomer checks email format", () => {
  assert.ok(validateCustomer({ name: "Bob", email: "not-an-email" }));
  assert.strictEqual(validateCustomer({ name: "Bob", email: "bob@example.com" }), null);
});

test("escapeHtml escapes markup", () => {
  assert.strictEqual(escapeHtml('<b>"x"</b>'), "&lt;b&gt;&quot;x&quot;&lt;/b&gt;");
  assert.strictEqual(escapeHtml(null), "");
});

test("normalizeTheme accepts known themes and falls back to light", () => {
  assert.strictEqual(normalizeTheme("light"), "light");
  assert.strictEqual(normalizeTheme("dark"), "dark");
  assert.strictEqual(normalizeTheme("high-contrast"), "high-contrast");
  assert.strictEqual(normalizeTheme("unknown"), DEFAULT_THEME);
  assert.strictEqual(normalizeTheme(null), DEFAULT_THEME);
});
