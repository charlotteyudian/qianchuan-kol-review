import { readFile, writeFile } from "node:fs/promises";
import { exportAnnotatedDraft } from "../lib/docx-review.ts";

const workspaceSource = await readFile("app/review-workspace.tsx", "utf8");
const draft = workspaceSource.match(/const demoDraft = `([\s\S]*?)`;\n/)?.[1];
if (!draft) throw new Error("无法从页面源码读取 Max Mara 演示稿件");

const issues = [
  { priority: "P0", title: "“最…最…”连用构成极限词风险", quote: "最彻底最鲜活的当代反叛", reason: "附件审稿报告将其列为广告法极限词风险，小红书/视频号可能限流。", suggestion: "替换为“一次彻底且鲜活的当代反叛”或“一次干脆利落的当代重构”。" },
  { priority: "P1", title: "3 个必带品牌 Tag 全部缺失", quote: "脚本结尾", reason: "Brief 明确要求发布文案/话题栏必须带上 3 个品牌 Tag。", suggestion: "补入 #MaxMara2026春夏 #MaxMara西装 #MaxMara非凡女性。" },
  { priority: "P2", title: "开头偏学术，前 5 秒缺少观看钩子", quote: "洛可可风起源于 18 世纪的法国", reason: "深度内容仍需先锚定观看动机。", suggestion: "先用 18 世纪宫廷繁复与当代职场的反差提问，再进入历史背景。" },
  { priority: "P2", title: "“大女主姿态”与品牌调性存在温差", quote: "大女主姿态", reason: "Brief 推荐智感、内敛、自我表达、投资性单品等高级词。", suggestion: "改为“属于自己的从容气场”或“内敛而笃定的自我表达”。" },
  { priority: "P1", title: "品牌核心概念“投资性单品”未融入", quote: "而精裁西装、低腰长裤的利落廓形", reason: "这是 Max Mara 西装的重要品牌资产。", suggestion: "自然补入“经得起时间考验的投资性单品”。" },
  { priority: "P2", title: "结尾缺少 CTA / 互动引导", quote: "在自我表达里活出松弛与深刻", reason: "价值升华后直接结束，缺少互动与收藏动机。", suggestion: "补充“你最喜欢哪一套造型？评论区和我聊聊”。" },
];

const blob = await exportAnnotatedDraft(null, draft, issues, "Max Mara SS26 · 岛屿白噪音 · 达人脚本审核修订稿");
await writeFile("public/demo/island-whitenoise-annotated.docx", new Uint8Array(await blob.arrayBuffer()));
