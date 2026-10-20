# Codex 准备引导

帮助零基础客户从账号准备走到 Codex 本机验收的图文引导。包含 44 个条件步骤、23 页原版 PDF、23 张已脱敏整页图，以及可以交给当前 AI 的执行入口。

当前版本：**v1.0.0**。完整路线覆盖 **Mac／Windows＋iPhone**。

## 开始使用

1. 在本仓库点击 **Code → Download ZIP**，下载并解压整个文件夹。
2. 双击文件夹中的 `index.html`，用常用浏览器打开，无需安装开发环境。
3. 选择设备和已有账号，保存路线；按每一步的图文和完成标志操作。
4. 需要 AI 帮助时，点击“复制入口给 AI”或“复制这一步给 AI”，粘贴到您当前使用的 AI。
5. 换设备、移动文件夹或清理浏览器前，导出 JSON 进度卡；回来时导入继续。

GitHub 的文件预览不会运行引导程序，请下载完整文件夹后打开。只有手机时可以先阅读并准备账号，最终仍需在目标电脑完成安装和验收。

## 交给 AI 使用

先让 AI 读取 [AI_START.txt](AI_START.txt)，再按客户实际情况选择当前步骤。

- **可读本地文件的 AI**：提供已解压文件夹，读取 [knowledge/steps.json](knowledge/steps.json)，按需展示 `assets/pages/` 中的原页图。
- **支持 Skill 的 AI**：读取 [SKILL.md](SKILL.md)；首次使用不要求先安装 Codex 或 Skill。
- **只能读取附件的 AI**：上传 `AI_START.txt` 和 [原版图解指南.pdf](原版图解指南.pdf)。
- **只能聊天的 AI**：从引导页复制当前步骤给它，客户对照本地 PDF 操作。

是否能够代做，取决于该 AI 当前实际连接的浏览器、电脑或手机工具。提供仓库链接不会自动赋予这些能力。程序本身负责图文引导和进度管理。

## 路线和完成条件

已有 ChatGPT Plus 的客户跳过重复购买；邮箱、Apple 账号和手机订阅按实际需要选择。短信和身份验证器分支只在当前页面确实要求时启用。进度卡保存路线和步骤状态，不保存密码、验证码、密钥或卡密。

完成状态由客户核对实际结果后记录。交接前需要验证 Codex 的本机回复、实际读取测试文件，以及通过真实 Computer Use 工具操作计算器。随后按引导实时下载并校验 [Claude 配置项目](https://github.com/ninedaywoo-web/claude-setup-guide) 的最新完整包，继续后续配置。

新 Apple 账号正常使用约两天后再充值订阅，是本指南的交付经验，不是官方规定或解除限制的保证；以当前页面和客服实际安排为准。

## 项目文件

| 文件 | 用途 |
| --- | --- |
| `index.html`、`style.css`、`app.js`、`core.js` | 离线引导页、路线判断和进度管理 |
| `data.js`、`knowledge/steps.json` | 相同内容的网页数据和 AI 结构化数据 |
| `AI_START.txt`、`SKILL.md` | 通用 AI 与 Skill 入口 |
| `原版图解指南.pdf`、`assets/pages/` | 23 页 PDF 与逐页脱敏图片 |
| `knowledge/full-guide.txt`、`knowledge/page-*.txt` | 完整正文及分页面文字 |
| `knowledge/source-map.json` | 步骤、原页和图片的来源映射 |
| `test-kit/read-me.txt` | 客户电脑实际读取验收用文件 |
| `验证记录.json` | 已完成检查及尚未验证的范围 |
| `version.json`、`manifest.json` | 版本与发布文件 SHA-256 清单 |
| `maintenance/` | 维护者检查脚本，客户无需运行 |

## 验证状态

首版已通过 13 项路线与交接逻辑检查、13 项 DOM 行为检查及 JavaScript 语法检查。原 PDF 共 23 页，含 13 张嵌入图和 52 个链接；发布包保留 23 张整页渲染图，已核对来源 SHA-256。

真实浏览器 `file://` 视觉验收尚未完成：自动浏览器工具拒绝访问该协议，未绕过限制。真实客户的注册、付款、订阅、客户 Codex 操作以及具体手机工具的完整交付也尚未实测。第 19 页订阅和第 21–22 页安装、权限内容缺少对应实拍图，补充部分以文字说明呈现。详见 [验证记录.json](验证记录.json)。

## 维护

修改步骤时同步更新 `knowledge/steps.json` 与 `data.js`。只使用最终脱敏 PDF 及其渲染图；不要提交客户进度、私人截图或凭据。

在项目根目录执行基础检查：

```sh
python3 maintenance/verify_release.py
node maintenance/verify_logic.cjs
```

需要复验 DOM 行为时，在 `maintenance/` 安装开发依赖后运行：

```sh
cd maintenance
npm install
npm test
```

发布前同步版本说明、验证记录和 `manifest.json`。清单不包含自身、Git 元数据及本地维护依赖。本仓库独立维护，后续 Claude 配置继续使用其原仓库。
