const csvInput = document.getElementById("csvInput");
const convertBtn = document.getElementById("convertBtn");
const copyBtn = document.getElementById("copyBtn");
const sampleBtn = document.getElementById("sampleBtn");
const tableWrapper = document.getElementById("tableWrapper");
const metaText = document.getElementById("metaText");
const workspace = document.querySelector(".workspace");
const splitter = document.getElementById("splitter");
const INPUT_PANEL_WIDTH_KEY = "csv-preview-input-panel-width";
const INPUT_PANEL_HEIGHT_KEY = "csv-preview-input-panel-height";

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

function setEmptyState(message, meta) {
  currentRows = [];
  tableWrapper.classList.add("empty");
  tableWrapper.innerHTML = `
    <div class="empty-state">
      <p>${message}</p>
    </div>
  `;
  metaText.textContent = meta;
  copyBtn.disabled = true;
}

function renderTable() {
  const source = csvInput.value.trim();
  if (!source) {
    setEmptyState("请输入 CSV 文本后再转换。", "请输入 CSV 内容");
    return;
  }

  const parsedRows = parseCsv(source);
  if (!parsedRows.length) {
    setEmptyState("未识别到有效 CSV 数据，请检查逗号、换行或引号格式。", "转换失败");
    return;
  }

  currentRows = normalizeRows(parsedRows);
  tableWrapper.classList.remove("empty");
  tableWrapper.innerHTML = buildTable(currentRows);
  metaText.textContent = `共 ${currentRows.length} 行，${currentRows[0].length} 列`;
  copyBtn.disabled = false;
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
    throw new Error("复制失败，请手动框选表格复制。");
  }
}

function fillSample() {
  csvInput.value = `姓名,部门,城市,备注
张三,销售,上海,"季度目标完成 120%"
李四,研发,深圳,"负责接口开发
和联调"
王五,财务,杭州,"""重点项目"" 跟进中"`;
  renderTable();
}

convertBtn.addEventListener("click", renderTable);

copyBtn.addEventListener("click", async () => {
  try {
    await copyTable();
    copyBtn.textContent = "已复制";
  } catch (error) {
    console.error(error);
    copyBtn.textContent = "复制失败";
  }

  window.setTimeout(() => {
    copyBtn.textContent = "复制整表";
  }, 1600);
});

sampleBtn.addEventListener("click", () => {
  fillSample();
});

csvInput.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    renderTable();
  }
});

if (new URLSearchParams(window.location.search).get("sample") === "1") {
  fillSample();
}

if (splitter && workspace) {
  let dragging = false;
  let dragMode = "width";

  const storedWidth = window.localStorage.getItem(INPUT_PANEL_WIDTH_KEY);
  const storedHeight = window.localStorage.getItem(INPUT_PANEL_HEIGHT_KEY);
  if (storedWidth) {
    workspace.style.setProperty("--input-panel-width", storedWidth);
  }
  if (storedHeight) {
    workspace.style.setProperty("--input-panel-height", storedHeight);
  }

  function isStackedLayout() {
    return window.getComputedStyle(workspace).flexDirection.startsWith("column");
  }

  splitter.addEventListener("pointerdown", (event) => {
    dragging = true;
    dragMode = isStackedLayout() ? "height" : "width";
    splitter.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  splitter.addEventListener("pointermove", (event) => {
    if (!dragging) {
      return;
    }

    const rect = workspace.getBoundingClientRect();
    if (dragMode === "height") {
      const minTop = 140;
      const maxTop = Math.max(minTop, rect.height - splitter.offsetHeight - 140);
      const nextHeight = Math.min(maxTop, Math.max(minTop, event.clientY - rect.top));
      const nextHeightPercent = `${Math.round((nextHeight / rect.height) * 1000) / 10}%`;
      workspace.style.setProperty("--input-panel-height", nextHeightPercent);
      window.localStorage.setItem(INPUT_PANEL_HEIGHT_KEY, nextHeightPercent);
      return;
    }

    const minLeft = 220;
    const maxLeft = Math.max(minLeft, rect.width - splitter.offsetWidth - 260);
    const nextWidth = Math.min(maxLeft, Math.max(minLeft, event.clientX - rect.left));
    const nextWidthValue = `${nextWidth}px`;
    workspace.style.setProperty("--input-panel-width", nextWidthValue);
    window.localStorage.setItem(INPUT_PANEL_WIDTH_KEY, nextWidthValue);
  });

  function stopDragging(event) {
    dragging = false;
    try {
      splitter.releasePointerCapture(event.pointerId);
    } catch (error) {
      void error;
    }
  }

  splitter.addEventListener("pointerup", stopDragging);
  splitter.addEventListener("pointercancel", stopDragging);
}
