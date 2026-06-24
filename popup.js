const openFloatingBtn = document.getElementById("openFloatingBtn");
const closeFloatingBtn = document.getElementById("closeFloatingBtn");
const statusText = document.getElementById("statusText");

function setStatus(message) {
  statusText.hidden = !message;
  statusText.textContent = message || "";
}

const blockedProtocols = ["chrome:", "edge:", "about:", "brave:"];

async function withActiveTab(fn) {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs && tabs[0];

  if (!tab || !tab.id) {
    setStatus("未获取到当前标签页。");
    return null;
  }

  const currentUrl = tab.url || "";
  if (blockedProtocols.some((protocol) => currentUrl.startsWith(protocol))) {
    setStatus("当前页面属于浏览器内部页面，Chrome 不允许显示浮窗。请在普通网站页面再试。");
    return null;
  }

  return fn(tab);
}

async function setFloatingState(open) {
  setStatus("");

  try {
    await withActiveTab(async (tab) => {
      await chrome.runtime.sendMessage({
        type: "csv-floating-state",
        tabId: tab.id,
        open
      });

      await chrome.tabs.sendMessage(tab.id, {
        type: open ? "csv-floating-open" : "csv-floating-close"
      });

      window.close();
    });
  } catch (error) {
    console.error(error);
    setStatus(error && error.message ? error.message : "操作失败，请在普通网页中重试。");
  }
}

openFloatingBtn.addEventListener("click", () => {
  setFloatingState(true);
});

closeFloatingBtn.addEventListener("click", () => {
  setFloatingState(false);
});
