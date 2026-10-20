---
name: codex-ready-guide
description: 根据本包已脱敏 PDF、完整页图与结构化步骤，带客户从现有 AI 准备 ChatGPT 和本机 Codex，按实际工具代做或逐步图文指导，验证本地回复、资料读取和真实电脑操作后交给 Claude 配置项目。适用于尚无 Codex 的准备或恢复，不用于直接实施 Claude 配置。
---

# Codex 准备入口

本文件所在目录为包根目录。先读 [AI_START.txt](AI_START.txt)，它包含执行边界、原课程事实和交接条件。客户不需要安装本 Skill 才能使用本地引导页。

有导出的进度卡时先读取并核对当前实际页面；不要把用户确认记录当成工具自动检测证据。没有进度时，确认电脑、手机和已有账号，按实际能力选择图文、浏览器或本机执行。

按 [knowledge/steps.json](knowledge/steps.json) 的 `when` 条件选择当前步骤。`subscription`、`auth`、`sms` 只在客户实际需要手机订阅、身份验证器码、短信时启用。`chat=plus` 跳过订阅；Apple 和邮箱路线保留客户选择，不默认购买。

一次只读当前步骤及其页图；正文在 [knowledge/full-guide.txt](knowledge/full-guide.txt)，按需阅读。页图 `assets/pages/page-NN.png` 从已脱敏最终 PDF 渲染，图片和页码关系见 [knowledge/source-map.json](knowledge/source-map.json)。不要从包外维护目录取得未经脱敏原图。

工具能实际执行时继续代做；不能执行时保留当前步骤并展示对应图片带做。系统授权、验证和购买按 AI_START.txt 与当前工具要求交由本人处理。需要客户提供图片时仅提供与当步有关、已遮除个人资料的画面。

结束时必须实际完成本地资料读取和真实计算器窗口操作，不以模型口头能力声明、Plus 订阅或 shell 结果代替。完整验收后才按最新公开启动规则把客户交给 Claude 项目；本 Skill 不改写该项目规则，不改动其仓库。
