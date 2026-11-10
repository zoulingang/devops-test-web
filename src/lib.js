// Pure helpers, shared by the browser app and the Node tests.
const FIELDS = ["name", "email", "phone", "company", "notes"];
const THEMES = ["light", "dark", "high-contrast"];
const DEFAULT_THEME = "light";

function formToCustomer(values) {
  const customer = {};
  for (const field of FIELDS) {
    const value = (values[field] ?? "").trim();
    customer[field] = value === "" ? null : value;
  }
  return customer;
}

function validateCustomer(customer) {
  if (!customer.name) return "姓名不能为空";
  if (customer.email && !/^[^\s@]+@[^\s@]+$/.test(customer.email)) return "邮箱格式不正确";
  return null;
}

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

function normalizeTheme(theme) {
  return THEMES.includes(theme) ? theme : DEFAULT_THEME;
}

if (typeof module !== "undefined") {
  module.exports = { FIELDS, THEMES, DEFAULT_THEME, formToCustomer, validateCustomer, escapeHtml, normalizeTheme };
}
