const HOST_ID = "csv-to-excel-floating-host";
const FRAME_ID = "csv-to-excel-floating-frame";
const STYLE_ID = "csv-to-excel-floating-style";
const RESIZE_HANDLE_ID = "csv-to-excel-floating-resize";
const SIZE_STORAGE_KEY = "csv-floating-size";
const PAGE_SPACE_WIDTH_VAR = "--csv-to-excel-sidebar-width";
const PAGE_SPACE_STYLES = [
  "width",
  "max-width",
  "min-width",
  "margin-right",
  "box-sizing",
  "overflow-x"
];
const ROOT_SPACE_STYLES = ["overflow-x"];
const DEFAULT_WIDTH = 520;
const DEFAULT_HEIGHT = 620;
const MIN_WIDTH = 360;
const MIN_HEIGHT = 420;

function getMaxWidth() {
  return Math.max(MIN_WIDTH, window.innerWidth - 24);
}

function getMaxHeight() {
  return Math.max(MIN_HEIGHT, window.innerHeight - 120);
}

function clampSize(width, height) {
  return {
    width: Math.min(getMaxWidth(), Math.max(MIN_WIDTH, Math.round(width))),
    height: Math.min(getMaxHeight(), Math.max(MIN_HEIGHT, Math.round(height)))
  };
}

async function saveSize(host) {
  const { width, height } = clampSize(host.offsetWidth, host.offsetHeight);
  await chrome.storage.local.set({
    [SIZE_STORAGE_KEY]: { width, height }
  });
}

async function loadSize() {
  const result = await chrome.storage.local.get(SIZE_STORAGE_KEY);
  const stored = result[SIZE_STORAGE_KEY];
  if (!stored) {
    return clampSize(DEFAULT_WIDTH, DEFAULT_HEIGHT);
  }

  return clampSize(stored.width, stored.height);
}

function applySize(host, width, height) {
  const next = clampSize(width, height);
  host.style.setProperty("width", `${next.width}px`, "important");
  host.style.setProperty("height", "100vh", "important");
  host.style.setProperty("top", "0", "important");
  host.style.setProperty("right", "0", "important");
  host.style.setProperty("bottom", "0", "important");
  host.style.setProperty("left", "auto", "important");
  reservePageSpace(next.width);
}

function reservePageSpace(width) {
  if (!document.body) {
    return;
  }

  const sidebarWidth = `${Math.round(width)}px`;
  const layoutWidth = `calc(100vw - ${sidebarWidth})`;

  rememberInlineStyles(document.body, PAGE_SPACE_STYLES, "body");
  rememberInlineStyles(document.documentElement, ROOT_SPACE_STYLES, "root");

  document.documentElement.style.setProperty(PAGE_SPACE_WIDTH_VAR, sidebarWidth);
  document.documentElement.style.setProperty("overflow-x", "hidden", "important");
  document.body.style.setProperty("width", layoutWidth, "important");
  document.body.style.setProperty("max-width", layoutWidth, "important");
  document.body.style.setProperty("min-width", "0", "important");
  document.body.style.setProperty("margin-right", sidebarWidth, "important");
  document.body.style.setProperty("box-sizing", "border-box", "important");
  document.body.style.setProperty("overflow-x", "hidden", "important");
}

function releasePageSpace() {
  if (!document.body) {
    return;
  }

  restoreInlineStyles(document.body, PAGE_SPACE_STYLES, "body");
  restoreInlineStyles(document.documentElement, ROOT_SPACE_STYLES, "root");
  document.documentElement.style.removeProperty(PAGE_SPACE_WIDTH_VAR);
}

function rememberInlineStyles(element, properties, keyPrefix) {
  for (const property of properties) {
    const valueKey = `csvToExcelOriginal${keyPrefix}${toDatasetSuffix(property)}`;
    const priorityKey = `${valueKey}Priority`;
    if (valueKey in element.dataset) {
      continue;
    }

    element.dataset[valueKey] = element.style.getPropertyValue(property);
    element.dataset[priorityKey] = element.style.getPropertyPriority(property);
  }
}

function restoreInlineStyles(element, properties, keyPrefix) {
  for (const property of properties) {
    const valueKey = `csvToExcelOriginal${keyPrefix}${toDatasetSuffix(property)}`;
    const priorityKey = `${valueKey}Priority`;
    const originalValue = element.dataset[valueKey];
    const originalPriority = element.dataset[priorityKey];

    if (originalValue !== undefined) {
      if (originalValue) {
        element.style.setProperty(property, originalValue, originalPriority || "");
      } else {
        element.style.removeProperty(property);
      }
      delete element.dataset[valueKey];
      delete element.dataset[priorityKey];
    }
  }
}

function toDatasetSuffix(property) {
  return property
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${HOST_ID} {
      position: fixed !important;
      top: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: min(${DEFAULT_WIDTH}px, calc(100vw - 24px)) !important;
      height: 100vh !important;
      min-width: ${MIN_WIDTH}px !important;
      min-height: 100vh !important;
      max-width: calc(100vw - 24px) !important;
      max-height: 100vh !important;
      z-index: 2147483647 !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      background: #ffffff !important;
      color: #2f3747 !important;
      border: 1px solid #d9e7ff !important;
      border-right: 0 !important;
      border-radius: 12px 0 0 12px !important;
      box-shadow: -14px 0 42px rgba(37, 55, 92, 0.16) !important;
    }

    #${HOST_ID}.is-minimized {
      height: 52px !important;
      min-height: 52px !important;
      max-height: 52px !important;
    }

    #${HOST_ID} .csv-float-toolbar {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 12px !important;
      height: 52px !important;
      padding: 0 12px 0 16px !important;
      background: #ffffff !important;
      border-bottom: 1px solid #d9e7ff !important;
      cursor: default !important;
      user-select: none !important;
      font: 600 13px/1.2 "Segoe UI", "Microsoft YaHei", sans-serif !important;
      color: #2f3747 !important;
    }

    #${HOST_ID} .csv-float-title {
      color: #2f3747 !important;
      font: 600 13px/1.2 "Segoe UI", "Microsoft YaHei", sans-serif !important;
    }

    #${HOST_ID} .csv-float-actions {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
    }

    #${HOST_ID} .csv-float-btn {
      height: 32px !important;
      padding: 0 12px !important;
      border: 1px solid #d9e7ff !important;
      border-radius: 8px !important;
      background: #ffffff !important;
      color: #3c4658 !important;
      cursor: pointer !important;
      font: 600 12px/1 "Segoe UI", "Microsoft YaHei", sans-serif !important;
    }

    #${HOST_ID} .csv-float-btn:hover {
      background: #f5f9ff !important;
      border-color: #c5dafd !important;
    }

    #${HOST_ID} .csv-float-frame {
      flex: 1 1 auto !important;
      width: 100% !important;
      border: 0 !important;
      background: #ffffff !important;
    }

    #${HOST_ID} .csv-float-resize {
      position: absolute !important;
      left: -4px !important;
      top: 0 !important;
      bottom: 0 !important;
      width: 8px !important;
      height: auto !important;
      cursor: ew-resize !important;
      z-index: 2 !important;
      background: transparent !important;
    }

    #${HOST_ID} .csv-float-resize:hover {
      background: rgba(105, 145, 214, 0.16) !important;
    }

    #${HOST_ID}.is-minimized .csv-float-frame {
      display: none !important;
    }

    #${HOST_ID}.is-minimized .csv-float-resize {
      display: none !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

function syncOpenState(open) {
  chrome.runtime.sendMessage({
    type: "csv-floating-state",
    open
  });
}

function wireDrag(host, toolbar) {
  let dragging = false;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  toolbar.addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest("button")) {
      return;
    }

    dragging = true;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;

    const rect = host.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    host.style.left = `${rect.left}px`;
    host.style.top = `${rect.top}px`;
    host.style.right = "auto";

    toolbar.setPointerCapture(pointerId);
    event.preventDefault();
  });

  toolbar.addEventListener("pointermove", (event) => {
    if (!dragging) {
      return;
    }

    const nextLeft = Math.max(8, Math.min(window.innerWidth - host.offsetWidth - 8, startLeft + event.clientX - startX));
    const nextTop = Math.max(8, Math.min(window.innerHeight - host.offsetHeight - 8, startTop + event.clientY - startY));

    host.style.left = `${nextLeft}px`;
    host.style.top = `${nextTop}px`;
  });

  function stopDrag() {
    dragging = false;
    if (pointerId !== null) {
      try {
        toolbar.releasePointerCapture(pointerId);
      } catch (error) {
        void error;
      }
    }
    pointerId = null;
  }

  toolbar.addEventListener("pointerup", stopDrag);
  toolbar.addEventListener("pointercancel", stopDrag);
}

function wireResize(host) {
  const handle = host.querySelector(".csv-float-resize");
  if (!handle) {
    return;
  }

  let resizing = false;
  let pointerId = null;
  let startX = 0;
  let startWidth = 0;
  let saveTimer = null;

  function scheduleSave() {
    if (saveTimer) {
      window.clearTimeout(saveTimer);
    }
    saveTimer = window.setTimeout(() => {
      saveSize(host).catch(() => {});
    }, 120);
  }

  handle.addEventListener("pointerdown", (event) => {
    resizing = true;
    pointerId = event.pointerId;
    startX = event.clientX;
    startWidth = host.offsetWidth;
    handle.setPointerCapture(pointerId);
    event.preventDefault();
  });

  handle.addEventListener("pointermove", (event) => {
    if (!resizing) {
      return;
    }

    const nextWidth = startWidth - (event.clientX - startX);
    applySize(host, nextWidth, window.innerHeight);
    scheduleSave();
  });

  function stopResize() {
    if (!resizing) {
      return;
    }

    resizing = false;
    if (pointerId !== null) {
      try {
        handle.releasePointerCapture(pointerId);
      } catch (error) {
        void error;
      }
    }
    pointerId = null;
    saveSize(host).catch(() => {});
  }

  handle.addEventListener("pointerup", stopResize);
  handle.addEventListener("pointercancel", stopResize);
}

function ensureHost() {
  ensureStyles();

  let host = document.getElementById(HOST_ID);
  if (host) {
    return host;
  }

  host = document.createElement("div");
  host.id = HOST_ID;
  host.innerHTML = `
    <div class="csv-float-toolbar">
      <span class="csv-float-title">CSV 转 Excel 浮窗</span>
      <div class="csv-float-actions">
        <button type="button" class="csv-float-btn" data-role="minimize">收起</button>
        <button type="button" class="csv-float-btn" data-role="close">关闭</button>
      </div>
    </div>
    <iframe id="${FRAME_ID}" class="csv-float-frame" allow="clipboard-read; clipboard-write"></iframe>
    <div id="${RESIZE_HANDLE_ID}" class="csv-float-resize" title="拖动调整浮窗大小"></div>
  `;

  const frame = host.querySelector("iframe");
  if (frame) {
    frame.src = chrome.runtime.getURL("workspace.html");
  }

  wireResize(host);

  host.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const role = target.getAttribute("data-role");
    if (role === "close") {
      closeFloatingWindow();
      return;
    }

    if (role === "minimize") {
      host.classList.toggle("is-minimized");
      if (host.classList.contains("is-minimized")) {
        releasePageSpace();
      } else {
        reservePageSpace(host.offsetWidth);
      }
      target.textContent = host.classList.contains("is-minimized") ? "展开" : "收起";
    }
  });

  document.documentElement.appendChild(host);
  return host;
}

async function openFloatingWindow() {
  const host = ensureHost();
  const size = await loadSize();
  applySize(host, size.width, size.height);
  host.classList.remove("is-minimized");

  const minimizeBtn = host.querySelector('[data-role="minimize"]');
  if (minimizeBtn) {
    minimizeBtn.textContent = "收起";
  }

  syncOpenState(true);
}

function closeFloatingWindow() {
  const host = document.getElementById(HOST_ID);
  if (host) {
    host.remove();
  }

  releasePageSpace();
  syncOpenState(false);
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "csv-floating-open") {
    openFloatingWindow().catch(() => {});
  }

  if (message?.type === "csv-floating-close") {
    closeFloatingWindow();
  }
});

chrome.runtime.sendMessage({ type: "csv-floating-query" }, (response) => {
  if (chrome.runtime.lastError) {
    return;
  }

  if (response?.open) {
    openFloatingWindow().catch(() => {});
  }
});

window.addEventListener("resize", () => {
  const host = document.getElementById(HOST_ID);
  if (!host || host.classList.contains("is-minimized")) {
    return;
  }

  applySize(host, host.offsetWidth, host.offsetHeight);
});
