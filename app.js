const csvInput = document.getElementById("csvInput");
const convertBtn = document.getElementById("convertBtn");
const copyBtn = document.getElementById("copyBtn");
const sampleBtn = document.getElementById("sampleBtn");
const tableWrapper = document.getElementById("tableWrapper");
const metaText = document.getElementById("metaText");

let currentRows = [];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((currentRow) => currentRow.some((cell) => cell !== ""));
}

function normalizeRows(rows) {
  const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0);
  return rows.map((row) => {
    const nextRow = [...row];
    while (nextRow.length < maxCols) {
      nextRow.push("");
    }
    return nextRow;
  });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildTable(rows) {
  const [headerRow, ...bodyRows] = rows;
  const thead = `
    <thead>
      <tr>${headerRow.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr>
    </thead>
  `;
  const tbody = `
    <tbody>
      ${bodyRows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
        )
        .join("")}
    </tbody>
  `;

  return `<table id="resultTable">${thead}${tbody}</table>`;
}

function toTabSeparated(rows) {
  return rows.map((row) => row.join("\t")).join("\n");
}

async function copyTable() {
  if (!currentRows.length) {
    return;
  }

  const table = document.getElementById("resultTable");
  const html = table.outerHTML;
  const text = toTabSeparated(currentRows);

  if (navigator.clipboard && window.ClipboardItem) {
    try {
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" })
      });
      await navigator.clipboard.write([item]);
      return;
    } catch (error) {
      console.warn("Clipboard API 不可用，使用兼容复制方式。", error);
    }
  }

  const selection = window.getSelection();
  const range = document.createRange();
  const ghost = document.createElement("div");

  ghost.style.position = "fixed";
  ghost.style.left = "-9999px";
  ghost.style.top = "0";
  ghost.innerHTML = html;
  document.body.appendChild(ghost);

  selection.removeAllRanges();
  range.selectNodeContents(ghost);
  selection.addRange(range);

  const copied = document.execCommand("copy");

  selection.removeAllRanges();
  document.body.removeChild(ghost);

  if (!copied) {
    throw new Error("当前浏览器不支持自动复制，请手动选中表格后复制。");
  }
}

function renderTable() {
  const source = csvInput.value.trim();
  if (!source) {
    currentRows = [];
    tableWrapper.classList.add("empty");
    tableWrapper.innerHTML = `
      <div class="empty-state">
        <p>请输入 CSV 文本后再转换。</p>
      </div>
    `;
    metaText.textContent = "请输入 CSV 内容";
    copyBtn.disabled = true;
    return;
  }

  const parsedRows = parseCsv(source);
  if (!parsedRows.length) {
    currentRows = [];
    tableWrapper.classList.add("empty");
    tableWrapper.innerHTML = `
      <div class="empty-state">
        <p>未识别到有效 CSV 数据。</p>
        <p>请检查逗号、换行或引号格式。</p>
      </div>
    `;
    metaText.textContent = "转换失败";
    copyBtn.disabled = true;
    return;
  }

  currentRows = normalizeRows(parsedRows);
  tableWrapper.classList.remove("empty");
  tableWrapper.innerHTML = buildTable(currentRows);
  metaText.textContent = `共 ${currentRows.length} 行，${currentRows[0].length} 列`;
  copyBtn.disabled = false;
}

convertBtn.addEventListener("click", renderTable);

copyBtn.addEventListener("click", async () => {
  try {
    await copyTable();
    copyBtn.textContent = "已复制";
    setTimeout(() => {
      copyBtn.textContent = "复制整表";
    }, 1600);
  } catch (error) {
    copyBtn.textContent = "复制失败";
    setTimeout(() => {
      copyBtn.textContent = "复制整表";
    }, 1600);
    console.error(error);
  }
});

sampleBtn.addEventListener("click", () => {
  csvInput.value = `姓名,部门,城市,备注
张三,销售,上海,"季度目标完成 120%"
李四,研发,深圳,"负责接口开发
和联调"
王五,财务,杭州,"""重点项目"" 跟进中"`;
  renderTable();
});

csvInput.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    renderTable();
  }
});
