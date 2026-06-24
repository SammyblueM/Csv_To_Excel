# CSV 转 Excel 预览

一个 Chrome 扩展，用于把 CSV 文本快速转换为可预览、可复制的表格。插件使用 Chrome 原生右侧边栏展示，不遮挡当前网页，适合在浏览网页、整理资料或编写文档时临时处理 CSV 数据。

## 功能特点

- 在 Chrome 原生 Side Panel 右侧边栏中运行。
- 点击扩展图标即可打开工具，无需二次确认。
- 支持粘贴 CSV 文本并转换为表格预览。
- 支持复制完整表格，方便粘贴到 Excel、WPS、Word 等工具。
- 支持标准 CSV 解析，包括逗号、换行和双引号内容。
- 支持调节 `CSV Input` 和 `Table Preview` 两个区域的高度。
- 高度调整会保存在本地，下次打开继续沿用。
- 无需后端服务，无需 nginx，纯浏览器本地运行。

## 安装方式

1. 打开 Chrome，进入 `chrome://extensions/`。

2. 打开右上角的“开发者模式”。

3. 点击“加载已解压的扩展程序”。

4. 选择本项目目录，例如：

   ```text
   E:\Codex-E\CsvToExcel\chrome-extension
   ```

5. 加载成功后，浏览器工具栏会出现 `CSV 转 Excel 预览` 扩展。

## 使用方式

1. 在任意普通网页中点击浏览器工具栏里的扩展图标。
2. Chrome 会在右侧打开 `CSV 转 Excel 预览` 侧边栏。
3. 在 `CSV Input` 区域粘贴 CSV 文本。
4. 点击“转换”，或按 `Ctrl + Enter`。
5. 在 `Table Preview` 区域查看表格预览。
6. 点击“复制整表”，将表格复制到剪贴板。

## 调整区域高度

`CSV Input` 和 `Table Preview` 中间有一条横向分隔条。

- 向上拖动：减小输入区高度，增加预览区高度。
- 向下拖动：增加输入区高度，减小预览区高度。
- 调整后的比例会自动保存在浏览器本地。

## 示例 CSV

```csv
日期,人员分类,工作量
2026年3月,数据安全审计技术支持,7
2026年3月,移动应用个人隐私合规检测技术支持,7
2026年4月,数据分类分级技术支持,7
```

转换后可以直接在右侧边栏中预览为表格，并复制到 Excel、WPS 或 Word。

## 项目结构

```text
chrome-extension/
├── manifest.json      # Chrome 扩展配置
├── background.js      # 点击扩展图标后打开 Side Panel
├── workspace.html     # 侧边栏页面
├── workspace.css      # 侧边栏样式
├── workspace.js       # CSV 解析、表格渲染、复制、区域高度调整
├── icons/             # 扩展图标
└── README.md
```

## 技术说明

- 基于 Chrome Manifest V3。
- 使用 `sidePanel` API 打开原生右侧边栏。
- 不再向当前网页注入浮窗，因此不会遮挡网页内容。
- CSV 解析和表格渲染均在浏览器本地完成。
- 不上传、不存储用户粘贴的 CSV 内容。

## 开发与调试

修改代码后，需要在 Chrome 扩展管理页刷新扩展：

1. 打开 `chrome://extensions/`。
2. 找到 `CSV 转 Excel 预览`。
3. 点击刷新按钮。
4. 重新打开侧边栏查看效果。

如需检查脚本语法：

```bash
node --check background.js
node --check workspace.js
```

如需检查 `manifest.json`：

```bash
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest ok')"
```

## 更新记录

### v1.1.0

- 改为 Chrome 原生 Side Panel 侧边栏模式。
- 移除旧版页面浮窗和二次确认弹窗。
- 点击扩展图标后直接打开右侧边栏。
- 新增输入区和预览区高度调节功能。
- 优化侧边栏窄宽度布局。

### v1.0.0

- 支持 CSV 文本转换为表格预览。
- 支持复制完整表格。
