# 仟传小省力·达人稿件审核

面向广告公司客户总监、内容团队与达人投放执行人员的 KOL 稿件审核工作台。系统以项目为单位沉淀品牌 Brief，并结合小红书/抖音平台规则、达人历史内容风格和商业内容风险，对达人稿件进行结构化审核。

线上演示：[仟传小省力·达人稿件审核](https://gaojian-kol-review.charlotteyudian.chatgpt.site/)

## 核心能力

- 项目化管理：同一品牌项目只需维护一次 Brief，后续持续提交达人稿件。
- Brief 完成度审核：检查必带卖点、品牌信息、话题、禁用表述与传播目标。
- 达人风格匹配：依据达人公开内容习惯，判断稿件大纲与语言是否符合个人风格。
- 平台适配审核：分别检查小红书图文/视频笔记和抖音短视频脚本。
- 风险分级：按 P0、P1、P2 输出合规、事实、表达和内容表现问题。
- Word 批注导出：问题原文使用红字与黄色高亮，批注区区分原文、审核问题、修改建议和审核依据。
- Max Mara 示例：项目内附 Brief、达人稿件、审核报告和带批注 Word 示例。

## 项目结构

```text
app/                      网页页面与接口
db/                       项目及稿件数据结构
lib/docx-review.ts        Word 原生批注生成
public/demo/              Max Mara 演示附件
tests/                    导出与页面测试
codex-skill/
  kol-content-review/     可安装的 Codex 审稿 Skill
```

## 本地运行

环境要求：Node.js 22.13 或更高版本。

```bash
pnpm install
pnpm dev
```

构建与测试：

```bash
pnpm test
pnpm build
```

## 安装 Codex Skill

将 `codex-skill/kol-content-review` 复制到个人 Codex Skills 目录：

```bash
cp -R codex-skill/kol-content-review ~/.codex/skills/
```

重新启动 Codex 后，即可在小红书、抖音达人稿件审核任务中使用。

## 审核输出

每篇稿件会输出：

1. 整体发布建议。
2. Brief 完成度与平台适配判断。
3. 达人风格匹配判断。
4. P0/P1/P2 分级问题清单。
5. 对应原文、修改建议和审核依据。
6. 可继续流转的 Word 原生批注稿。

## 数据与权限

- 环境变量、构建缓存、依赖目录和本地输出文件不会提交到仓库。
- 当前 GitHub 仓库建议保持为私有仓库。
- 演示附件仅用于产品功能展示，真实客户项目资料不应直接提交到源码仓库。
