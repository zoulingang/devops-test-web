const API = `${window.CRM_API_BASE}/api/customers`;

const form = document.getElementById("customer-form");
const tbody = document.getElementById("customer-rows");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");

let customers = [];

function showMessage(text, isError = false) {
  message.textContent = text;
  message.className = isError ? "error" : "";
}

async function request(url, options = {}) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) throw new Error(`请求失败：${res.status}`);
  return res.status === 204 ? null : res.json();
}

function render() {
  if (customers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty">暂无客户</td></tr>`;
    return;
  }
  tbody.innerHTML = customers.map((c) => `
    <tr>
      <td>${escapeHtml(c.name)}</td>
      <td>${escapeHtml(c.email)}</td>
      <td>${escapeHtml(c.phone)}</td>
      <td>${escapeHtml(c.company)}</td>
      <td>${escapeHtml(c.notes)}</td>
      <td class="actions">
        <button data-edit="${c.id}">编辑</button>
        <button data-delete="${c.id}" class="danger">删除</button>
      </td>
    </tr>`).join("");
}

async function load() {
  try {
    customers = await request(API);
    render();
  } catch (err) {
    showMessage(`无法连接后端 ${window.CRM_API_BASE}：${err.message}`, true);
  }
}

function resetForm() {
  form.reset();
  form.elements.id.value = "";
  submitBtn.textContent = "新增客户";
  cancelBtn.hidden = true;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form));
  const customer = formToCustomer(values);
  const error = validateCustomer(customer);
  if (error) return showMessage(error, true);

  try {
    if (values.id) {
      await request(`${API}/${values.id}`, { method: "PUT", body: JSON.stringify(customer) });
      showMessage("已保存");
    } else {
      await request(API, { method: "POST", body: JSON.stringify(customer) });
      showMessage("已新增");
    }
    resetForm();
    await load();
  } catch (err) {
    showMessage(err.message, true);
  }
});

cancelBtn.addEventListener("click", resetForm);

tbody.addEventListener("click", async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) {
    const c = customers.find((x) => String(x.id) === editId);
    for (const field of FIELDS) form.elements[field].value = c[field] ?? "";
    form.elements.id.value = c.id;
    submitBtn.textContent = "保存修改";
    cancelBtn.hidden = false;
    form.elements.name.focus();
  } else if (deleteId && confirm("确定删除该客户？")) {
    try {
      await request(`${API}/${deleteId}`, { method: "DELETE" });
      showMessage("已删除");
      await load();
    } catch (err) {
      showMessage(err.message, true);
    }
  }
});

load();
