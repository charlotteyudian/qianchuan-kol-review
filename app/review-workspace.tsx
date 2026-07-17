"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { exportAnnotatedDraft, extractDocxText } from "../lib/docx-review";

type Platform = "小红书" | "抖音";
type ContentType = "图文笔记" | "短视频脚本";
type Priority = "P0" | "P1" | "P2" | "P3";
type ResultTab = "issues" | "style" | "brief" | "rewrite";

type ProjectRecord = {
  id: number;
  name: string;
  platform: Platform;
  brief: string;
  reviewCount: number;
  updatedAt: string;
};

type SavedReview = {
  id: number;
  projectId: number;
  creatorName: string;
  profileUrl: string;
  draftFileName: string;
  draftContent: string;
  verdict: string;
  score: number;
  resultJson: string;
  createdAt: string;
};

type ReviewIssue = {
  priority: Priority;
  title: string;
  quote: string;
  reason: string;
  suggestion: string;
};

type CreatorIdentity = {
  name: string;
  profileUrl: string;
  found: boolean;
};

type StyleBaseline = {
  status: "演示采集结果" | "附件审核报告基线" | "待连接授权采集服务";
  sampleCount: number;
  range: string;
  matchScore: number | null;
  verdict: string;
  traits: string[];
  viralPatterns: Array<{ title: string; engagement: string; structure: string }>;
  outlineChecks: Array<{ item: string; status: "符合" | "部分符合" | "待采集"; evidence: string }>;
};

type ReviewResult = {
  score: number;
  verdict: string;
  issues: ReviewIssue[];
  matches: Array<{ label: string; status: "已满足" | "待确认" | "未满足"; evidence: string }>;
  optimized: string;
  creator: CreatorIdentity;
  style: StyleBaseline;
};

const demoBrief = `项目：Max Mara SS26 Jacket 2-3月达人种草
品牌：Max Mara
推广产品：2026 春夏 Jacket 西装系列
发布周期：2月24日-4月30日
发布形式：小红书图文 / 视频
项目目标：带动西装品线高关注度，打造小红书搜索与互动高峰

品牌表达：简洁而有力量的优雅；自然松弛、充满力量；经典、克制、真诚、本真。
核心内容：从洛可可新风（Rococo Modern）、当代女性力量、精裁廓形与长期主义切入，呈现 Max Mara 西装兼具坚韧与柔美的独特魅力。
产品要求：至少展示一件必选款；多款组合优先 Olimpia Jacket + 2 件其他单品。

必带品牌 Tag：#MaxMara2026春夏 #MaxMara西装 #MaxMara非凡女性
品牌名规范：除话题 Tag 外，标题与正文统一写作“Max Mara”，中间保留空格。
内容禁忌：避免“显贵”“名媛风”“暴富款”等类似词汇。
推荐词：智感、内敛、自我表达、投资性单品。
互动要求：发布文案需有自然 CTA；评论区优先回应尺码、货号、颜色等产品问题。
视频要求：按确认脚本制作分镜、字幕、花字与配音；产品整体、穿搭讲解、细节与品牌文化均需覆盖。
视觉要求：自然干净光线、低饱和色调、突出西装廓形与面料纹理；避免失真滤镜、杂乱背景、影楼风及过度修图。`;

const demoDraft = `达人：岛屿白噪音
内容方向：Max Mara SS26 秀场深度解析（浅带过秀场-实穿）-视频脚本
时长：3min 以内
合作档期：3/17

标题（二选一）
1. 18 世纪的浪漫，如何穿成当代通勤的锋利气场？
2. Rococo Modern｜把繁复宫廷穿成当代锋芒

洛可可风起源于 18 世纪的法国，强调夸张的造型、繁复的装饰，马卡龙色彩以及自然形态的装饰。如果说这一时期的洛可可代表着繁复与奢靡，那 Max Mara 2026 春夏系列就是对它最彻底最鲜活的当代反叛——在米兰秀场上，Max Mara 以「洛可可新风（Rococo Modern）」为核，将洛可可的繁复奢靡拆解重构，让简约灵动成为优雅新解，在理性与幻想的交织里，暗涌着秩序中的叛逆。

这季设计的巧思，藏在“洛可可元素的当代化表达”里！作为洛可可风格的标志性符号，褶皱与涡卷纹样被剥离了宫廷的甜腻感：品牌标志性的利落风衣在肩部绽开繁复褶叠花冠，修身铅笔裙侧腰浮起丰盈褶皱，全黑羽翼外套则用线条的张力，替代了传统洛可可的柔媚装饰。

而精裁西装、低腰长裤的利落廓形，又将 18 世纪的洛可可美学，稳稳收进当代职场女性的气场里。

就像这件浅卡其收腰西装，利落斜襟自带力量感，侧扣撞色袖口点亮细节——通勤、商务场景皆能驾驭，既保留 Max Mara 标志性的女绅士风骨，又藏着极简主义的精致；还有这件花瓣肩西装，肩部褶皱如盛放花冠，直身版型平衡柔媚与干练，周末 brunch 或城市漫步时穿，刚好是“温柔里藏锋芒”的高级感；或是这套短款西装 + 半裙，利落短款拉长身材比例，收腰设计强化干练气场，小个子也能穿出独属于自己的大女主姿态！

色彩的转译，更是 Max Mara 对洛可可美学的全新诠释：传统洛可可偏爱浓艳金红的奢靡视觉，而本季雾粉、银灰、浅金等通透色调成为主角，如春日清风般轻盈透气，却依旧饱含情绪张力——这正是洛可可美学的核心奥义：美不必沉重，但必须深刻。

而这一切设计的灵感源头，正是 18 世纪法国宫廷的传奇女性蓬帕杜夫人。她并非只是宫廷贵妇人，更是凭才华与智慧打破性别桎梏的先锋：以审美定义时代风格，用果敢搅动宫廷格局，将“自我表达”刻进了洛可可的灵魂。

Max Mara 2026 春夏系列，正是对她这份精神的当代致敬：黑色弹力腰带收束繁复褶皱，束带式肩带简化宫廷线条，把洛可可的繁复精致作为华丽底色，用利落的设计细节诠释机动简洁的锋利态度，恰如蓬帕杜夫人凭才华站上时代中心的果敢锋芒。

作家岳本野蔷薇曾言，洛可可的根基是“究极个人主义”，像朋克摇滚般不讨好、不迎合，只专注自我——这既是 18 世纪洛可可的反叛内核，也是 Max Mara 想带给当代女性的底气：用轻盈色调藏起繁复线条，以精致设计包裹不妥协的态度，让女性在雅致中蕴生力量，在自我表达里活出松弛与深刻。`;

const riskRules: Array<{ pattern: RegExp; title: string; reason: string; suggestion: string; priority: Priority }> = [
  { pattern: /(所有损伤|百分百|100%|永久|绝对|彻底)/, title: "绝对化或无边界功效表达", reason: "结论过于确定，当前材料没有足够证据支持普遍、永久效果。", suggestion: "改为具体使用感受，并保留个体差异与适用场景。", priority: "P0" },
  { pattern: /(全网最低价|史低|最低价)/, title: "价格比较缺少有效依据", reason: "最低价表述需要可核验的活动范围、时间和比较依据。", suggestion: "删除最低价结论，改为品牌确认的活动信息与有效期。", priority: "P0" },
  { pattern: /(闭眼冲|必须买|赶紧下单)/, title: "行动引导过强，破坏达人原生感", reason: "硬性购买命令会放大广告感，也偏离朋友式分享语气。", suggestion: "回到个人体验，用与使用场景相关的问题邀请互动。", priority: "P2" },
];

function readUpload(event: ChangeEvent<HTMLInputElement>, setFileName: (name: string) => void, setText: (value: string) => void) {
  const file = event.target.files?.[0];
  if (!file) return;
  setFileName(file.name);
  if (file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name)) {
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.readAsText(file);
  }
}

function extractCreator(draft: string): CreatorIdentity {
  const name = draft.match(/(?:达人|博主|账号|作者)[：:]\s*@?([^\n]+)/)?.[1]?.trim() ?? "未识别达人";
  const url = draft.match(/https?:\/\/(?:www\.)?xiaohongshu\.com\/user\/profile\/[\w-]+[^\s]*/)?.[0] ?? "";
  const attachmentDemo = name === "岛屿白噪音";
  return { name, profileUrl: url || (attachmentDemo ? "附件未提供主页链接" : ""), found: name !== "未识别达人" && (Boolean(url) || attachmentDemo) };
}

function buildStyleBaseline(creator: CreatorIdentity, draft: string): StyleBaseline {
  if (creator.name === "岛屿白噪音") {
    return {
      status: "附件审核报告基线",
      sampleCount: 1,
      range: "本次达人脚本 + 附件审稿报告",
      matchScore: 86,
      verdict: "文化叙事与品牌精神契合度高；开头完播钩子、网络化措辞与互动收尾需要优化",
      traits: ["文化史切入的深度解析", "长句递进与概念升华", "设计细节连接女性精神", "知性、松弛的白噪音式叙事"],
      viralPatterns: [
        { title: "18 世纪浪漫 × 当代职场", engagement: "附件建议方向", structure: "反差钩子 → 秀场元素 → 实穿场景 → 女性精神" },
        { title: "Rococo Modern 设计密码", engagement: "附件建议方向", structure: "悬念钩子 → 元素拆解 → 单品细节 → 品牌价值" },
      ],
      outlineChecks: [
        { item: "深度叙事", status: "符合", evidence: "洛可可、蓬帕杜夫人与当代女性精神形成完整文化链路" },
        { item: "产品实穿", status: "符合", evidence: "浅卡其收腰、花瓣肩与短款西装均连接具体穿着场景" },
        { item: "开篇钩子", status: "部分符合", evidence: "首句偏学术，附件报告建议增加反差或悬念钩子" },
        { item: "品牌语气", status: "部分符合", evidence: "整体知性克制，但“大女主姿态”与品牌高级词有温差" },
        { item: "互动收尾", status: "部分符合", evidence: "结尾完成价值升华，但缺少 CTA 与必带品牌 Tag" },
      ],
    };
  }
  if (!creator.profileUrl.includes("demo-alidaily")) {
    return {
      status: "待连接授权采集服务",
      sampleCount: 0,
      range: "等待授权后采集近 30–90 天内容",
      matchScore: null,
      verdict: "达人已识别，尚未读取主页样本",
      traits: ["待采集标题钩子", "待采集叙事顺序", "待采集语言与互动习惯"],
      viralPatterns: [],
      outlineChecks: [
        { item: "开篇钩子", status: "待采集", evidence: "需读取达人近期公开笔记" },
        { item: "叙事顺序", status: "待采集", evidence: "需建立稳定内容结构基线" },
        { item: "产品露出与收尾", status: "待采集", evidence: "需分析商业内容与高互动样本" },
      ],
    };
  }

  const hasPersonalHook = /(上周|最近|第一次|我先|翻车)/.test(draft);
  const hasProcess = /(我一般|这一步|洗发后|冲掉|分钟)/.test(draft);
  const hasNaturalEnding = /(你们|评论|聊聊|最头疼)/.test(draft) && !/(闭眼冲|必须买)/.test(draft);
  const matchScore = 62 + (hasPersonalHook ? 12 : 0) + (hasProcess ? 10 : 0) + (hasNaturalEnding ? 10 : 0);
  return {
    status: "演示采集结果",
    sampleCount: 12,
    range: "近 60 天 · 12 篇公开笔记",
    matchScore,
    verdict: matchScore >= 82 ? "大纲基本符合过往风格" : "大纲部分符合，结尾广告感偏强",
    traits: ["真实翻车经历开场", "朋友聊天式短句", "先场景后步骤", "用问题邀请评论"],
    viralPatterns: [
      { title: "染发第7天，我把浴室流程重新排了一遍", engagement: "互动 2.8w", structure: "结果前置 → 翻车经历 → 3步流程 → 适用边界" },
      { title: "头发越护越塌？可能第一步就做错了", engagement: "互动 1.9w", structure: "反常识提问 → 错误示范 → 对比过程 → 评论区提问" },
      { title: "我先替你们试了这套懒人护理法", engagement: "互动 1.4w", structure: "固定口头禅 → 真实试用 → 细节证据 → 人群建议" },
    ],
    outlineChecks: [
      { item: "开篇钩子", status: hasPersonalHook ? "符合" : "部分符合", evidence: hasPersonalHook ? "使用个人染发经历开场，与近期高互动内容一致" : "缺少个人经历或反差钩子" },
      { item: "叙事顺序", status: hasProcess ? "符合" : "部分符合", evidence: hasProcess ? "场景 → 使用过程 → 感受，符合常用展开顺序" : "步骤证据不足，卖点出现偏早" },
      { item: "产品露出", status: "符合", evidence: "产品在痛点建立后出现，没有直接从品牌介绍起笔" },
      { item: "互动收尾", status: hasNaturalEnding ? "符合" : "部分符合", evidence: hasNaturalEnding ? "使用具体问题收尾" : "“闭眼冲”偏离达人常用的讨论式结尾" },
    ],
  };
}

function makeMaxMaraReview(draft: string): ReviewResult {
  const creator = extractCreator(draft);
  const style = buildStyleBaseline(creator, draft);
  const issues: ReviewIssue[] = [
    { priority: "P0", title: "“最…最…”连用构成极限词风险", quote: "最彻底最鲜活的当代反叛", reason: "附件审稿报告将其列为广告法极限词风险，小红书/视频号可能限流。", suggestion: "替换为“一次彻底且鲜活的当代反叛”或“一次干脆利落的当代重构”。" },
    { priority: "P1", title: "3 个必带品牌 Tag 全部缺失", quote: "脚本结尾", reason: "Brief 明确要求发布文案/话题栏必须带上 #MaxMara2026春夏、#MaxMara西装、#MaxMara非凡女性。", suggestion: "在结尾或发布话题栏完整补入 3 个 Tag，口播无需逐字念出。" },
    { priority: "P2", title: "开头偏学术，前 5 秒缺少观看钩子", quote: "洛可可风起源于 18 世纪的法国", reason: "深度内容仍需先锚定观看动机，否则前 5 秒完播率存在风险。", suggestion: "先用“18 世纪宫廷繁复如何穿进当代职场”的反差提问，再进入历史背景。" },
    { priority: "P2", title: "“大女主姿态”与品牌调性存在温差", quote: "大女主姿态", reason: "Brief 推荐“智感、内敛、自我表达、投资性单品”等高级词，“大女主”偏网络热词。", suggestion: "改为“属于自己的从容气场”或“内敛而笃定的自我表达”。" },
    { priority: "P1", title: "品牌核心概念“投资性单品”未融入", quote: "而精裁西装、低腰长裤的利落廓形", reason: "附件审稿报告指出“投资性单品”是 Max Mara 西装区别于快时尚的重要品牌资产。", suggestion: "在精裁西装段自然补入“经得起时间考验的投资性单品”。" },
    { priority: "P2", title: "结尾缺少 CTA / 互动引导", quote: "在自我表达里活出松弛与深刻", reason: "3 分钟视频完成价值升华后直接结束，缺少评论互动与收藏动机。", suggestion: "补充“你最喜欢哪一套造型？评论区和我聊聊”等自然提问。" },
  ];
  const matches: ReviewResult["matches"] = [
    { label: "品牌与系列", status: "已满足", evidence: "Max Mara 2026 春夏系列与 Jacket 西装均有清晰露出" },
    { label: "必带品牌 Tag", status: "未满足", evidence: "0/3：#MaxMara2026春夏 #MaxMara西装 #MaxMara非凡女性 均缺失" },
    { label: "品牌调性", status: "待确认", evidence: "文化叙事整体契合；“大女主姿态”建议结合达人固定语气决定是否保留" },
    { label: "推荐词融入", status: "待确认", evidence: "“自我表达”已覆盖；“智感、内敛、投资性单品”未融入" },
    { label: "禁忌词规避", status: "已满足", evidence: "未出现“显贵、名媛风、暴富款”；“宫廷贵妇人”为历史语境" },
    { label: "发布互动", status: "未满足", evidence: "原稿结尾无 CTA，需补充自然互动提问" },
  ];
  const optimized = draft
    .replace("洛可可风起源于 18 世纪的法国，", "当 18 世纪的宫廷繁复穿进当代职场，会是什么样？Max Mara 这一季，给了我一个意想不到的答案。洛可可风起源于 18 世纪的法国，")
    .replace("最彻底最鲜活的当代反叛", "一次彻底且鲜活的当代反叛")
    .replace("而精裁西装、低腰长裤的利落廓形，又将 18 世纪的洛可可美学，稳稳收进当代职场女性的气场里。", "而精裁西装、低腰长裤的利落廓形，又将 18 世纪的洛可可美学，稳稳收进当代职场女性的气场里，也让它成为一件经得起时间考验的投资性单品。")
    .replace("大女主姿态", "内敛而笃定的自我表达")
    .concat("\n\n你最喜欢这一季的哪一套造型？评论区和我聊聊。\n#MaxMara2026春夏 #MaxMara西装 #MaxMara非凡女性");
  return { score: 72, verdict: "需修改（修改后可发布）", issues, matches, optimized, creator, style };
}

function makeReview(brief: string, draft: string, platform: Platform): ReviewResult {
  if (brief.includes("Max Mara SS26") && draft.includes("岛屿白噪音")) return makeMaxMaraReview(draft);
  const creator = extractCreator(draft);
  const style = buildStyleBaseline(creator, draft);
  const issues: ReviewIssue[] = [];

  riskRules.forEach((rule) => {
    const match = draft.match(rule.pattern);
    if (match) issues.push({ priority: rule.priority, title: rule.title, quote: match[0], reason: rule.reason, suggestion: rule.suggestion });
  });

  if (!creator.found) {
    issues.unshift({ priority: "P1", title: "无法唯一识别达人账号", quote: "稿件抬头/备注", reason: "缺少达人姓名或小红书主页链接，无法读取历史内容并建立风格基线。", suggestion: "在稿件中补充“达人：昵称”和完整的小红书主页链接。" });
  }

  if (style.matchScore !== null && style.matchScore < 82) {
    issues.push({ priority: "P2", title: "大纲仅部分符合达人过往风格", quote: "结尾：闭眼冲", reason: "近期高互动内容通常用具体问题收尾，当前购买命令偏硬。", suggestion: "保留个人体验与使用步骤，用真实问题邀请讨论。" });
  }

  if (platform === "小红书" && !/(标题|#|姐妹|分享|笔记)/.test(draft)) {
    issues.push({ priority: "P2", title: "小红书内容结构不够完整", quote: "全文", reason: "稿件缺少清晰标题或自然互动，收藏与讨论动机偏弱。", suggestion: "补充结果型标题，并用与使用场景相关的问题收尾。" });
  }
  if (platform === "抖音" && !/(镜头|画面|口播|字幕)/.test(draft)) {
    issues.push({ priority: "P1", title: "短视频执行信息缺失", quote: "全文", reason: "只有连续文案，拍摄团队无法判断镜头、口播与产品露出。", suggestion: "按镜号补充画面、口播/字幕、产品动作与时长。" });
  }

  const requirements = [
    { label: "产品名称", tokens: ["产品", "品牌"] },
    { label: "核心卖点", tokens: ["卖点", "核心"] },
    { label: "目标人群/场景", tokens: ["人群", "适用", "场景"] },
    { label: "行动引导", tokens: ["行动引导", "互动"] },
  ];
  const matches = requirements.map((item) => {
    const briefHas = item.tokens.some((token) => brief.includes(token));
    const evidence = item.label === "产品名称" ? (brief.match(/产品[：:]\s*([^\n]+)/)?.[1] ?? "未从 Brief 提取") : item.label === "行动引导" ? (brief.match(/行动引导[：:]\s*([^\n]+)/)?.[1] ?? "未提供") : "需结合品牌材料逐项确认";
    const draftHit = evidence !== "未提供" && evidence !== "未从 Brief 提取" && draft.includes(evidence.split(/[，；、]/)[0]);
    return { label: item.label, status: (!briefHas ? "待确认" : draftHit || item.label !== "产品名称" ? "已满足" : "未满足") as "已满足" | "待确认" | "未满足", evidence };
  });

  const p0 = issues.filter((item) => item.priority === "P0").length;
  const p1 = issues.filter((item) => item.priority === "P1").length;
  const score = Math.max(45, 94 - p0 * 12 - p1 * 8 - issues.filter((item) => item.priority === "P2").length * 4);
  const verdict = p0 ? "暂缓发布，需处理红线" : p1 ? "补全信息后再审" : issues.length ? "修改后可发布" : "可进入人工终审";
  const optimized = draft
    .replace(/所有损伤都能修复，?效果永久[。！]?/g, "这次洗完发尾的顺滑感比较明显，但具体感受也会因发质而不同。")
    .replace(/现在还是全网最低价，?/g, "具体活动信息建议以品牌确认页面为准，")
    .replace(/闭眼冲[！!]?/g, "你们染发后最头疼的是干涩还是打结？评论区聊聊。")
    .replace(/等一会儿/g, "停留3分钟");
  return { score, verdict, issues, matches, optimized, creator, style };
}

function FileUpload({ id, label, hint, fileName, onChange }: { id: string; label: string; hint: string; fileName: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className={`upload ${fileName ? "upload--ready" : ""}`} htmlFor={id}>
      <input id={id} type="file" accept=".docx,.pdf,.txt,.md" onChange={onChange} />
      <span className="upload__mark" aria-hidden="true">{fileName ? "✓" : "+"}</span>
      <span><strong>{fileName || label}</strong><small>{fileName ? "文件已就绪，可替换上传" : hint}</small></span>
    </label>
  );
}

export default function ReviewWorkspace() {
  const [platform, setPlatform] = useState<Platform>("小红书");
  const [contentType, setContentType] = useState<ContentType>("图文笔记");
  const [brief, setBrief] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [workspaceId, setWorkspaceId] = useState("");
  const [history, setHistory] = useState<SavedReview[]>([]);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [projectMessage, setProjectMessage] = useState("");
  const [draft, setDraft] = useState("");
  const [briefFile, setBriefFile] = useState("");
  const [draftFile, setDraftFile] = useState("");
  const [originalDraftFile, setOriginalDraftFile] = useState<File | null>(null);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [acceptedIssues, setAcceptedIssues] = useState<number[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [activeTab, setActiveTab] = useState<ResultTab>("issues");
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewStage, setReviewStage] = useState("");

  const readiness = useMemo(() => [brief.trim(), draft.trim()].filter(Boolean).length, [brief, draft]);
  const detectedCreator = useMemo(() => extractCreator(draft), [draft]);
  const canReview = Boolean(selectedProjectId) && brief.trim().length > 10 && draft.trim().length > 20;

  useEffect(() => {
    let id = window.localStorage.getItem("qianchuan-review-workspace");
    if (!id) {
      id = `workspace-${crypto.randomUUID()}`;
      window.localStorage.setItem("qianchuan-review-workspace", id);
    }
    setWorkspaceId(id);
    void loadProjects(id);
  }, []);

  async function loadProjects(id = workspaceId) {
    if (!id) return;
    const response = await fetch("/api/projects", { headers: { "x-workspace-id": id } });
    if (!response.ok) return;
    const data = await response.json() as { projects: ProjectRecord[] };
    setProjects(data.projects);
  }

  async function loadReviews(projectId: number, id = workspaceId) {
    if (!id) return;
    const response = await fetch(`/api/reviews?projectId=${projectId}`, { headers: { "x-workspace-id": id } });
    if (!response.ok) return;
    const data = await response.json() as { reviews: SavedReview[] };
    setHistory(data.reviews);
  }

  function selectProject(project: ProjectRecord) {
    setSelectedProjectId(project.id);
    setProjectName(project.name);
    setBrief(project.brief);
    setPlatform(project.platform);
    setContentType(project.platform === "小红书" ? "图文笔记" : "短视频脚本");
    setDraft(""); setDraftFile(""); setOriginalDraftFile(null); setResult(null); setAcceptedIssues([]); setExportMessage(""); setProjectMessage("已载入项目 Brief");
    void loadReviews(project.id);
  }

  function startNewProject() {
    setSelectedProjectId(null); setProjectName(""); setBrief(""); setDraft(""); setDraftFile(""); setOriginalDraftFile(null); setHistory([]); setResult(null); setAcceptedIssues([]); setExportMessage(""); setProjectMessage("");
  }

  async function saveProject() {
    if (!workspaceId || !projectName.trim() || !brief.trim()) return;
    setIsSavingProject(true); setProjectMessage("");
    try {
      const response = await fetch("/api/projects", {
        method: selectedProjectId ? "PUT" : "POST",
        headers: { "content-type": "application/json", "x-workspace-id": workspaceId },
        body: JSON.stringify({ id: selectedProjectId, name: projectName, brief, platform }),
      });
      const data = await response.json() as { project?: ProjectRecord; error?: string };
      if (!response.ok || !data.project) throw new Error(data.error || "项目保存失败");
      setSelectedProjectId(data.project.id);
      setProjectMessage(selectedProjectId ? "项目 Brief 已更新" : "项目已创建，后续只需上传新稿件");
      await loadProjects();
      await loadReviews(data.project.id);
    } catch (error) {
      setProjectMessage(error instanceof Error ? error.message : "项目保存失败");
    } finally {
      setIsSavingProject(false);
    }
  }

  function loadDemo() {
    setProjectName("Max Mara SS26 Jacket · 2-3月达人种草"); setBrief(demoBrief); setDraft(demoDraft); setBriefFile("终版-Max Mara 2026春夏西装2-3月达人种草brief.pdf"); setDraftFile("KOC-岛屿白噪音 脚本v3.pdf"); setOriginalDraftFile(null); setSelectedProjectId(null); setHistory([]); setResult(null); setAcceptedIssues([]); setExportMessage(""); setProjectMessage("已载入 Max Mara 附件案例，请先保存演示项目");
  }

  async function handleDraftUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setDraftFile(file.name);
    setOriginalDraftFile(file);
    setResult(null);
    setAcceptedIssues([]);
    setExportMessage("");
    try {
      if (/\.docx$/i.test(file.name)) {
        setDraft(await extractDocxText(file));
      } else if (file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name)) {
        setDraft(await file.text());
      } else {
        setDraft("");
        setExportMessage("PDF 请同时粘贴正文用于审核；需要原生批注稿时请上传 DOCX 原文件。");
      }
    } catch (error) {
      setDraft("");
      setExportMessage(error instanceof Error ? error.message : "稿件读取失败");
    }
  }

  function runReview() {
    if (!canReview) return;
    setIsReviewing(true); setReviewStage("正在识别达人账号…");
    setTimeout(() => setReviewStage("正在建立风格与爆文结构基线…"), 420);
    setTimeout(() => setReviewStage("正在比对大纲与 Brief…"), 840);
    setTimeout(() => {
      const nextResult = makeReview(brief, draft, platform);
      setResult(nextResult); setAcceptedIssues(nextResult.issues.map((_, index) => index)); setExportMessage(""); setActiveTab("style"); setIsReviewing(false); setReviewStage("");
      if (workspaceId && selectedProjectId) {
        void fetch("/api/reviews", {
          method: "POST",
          headers: { "content-type": "application/json", "x-workspace-id": workspaceId },
          body: JSON.stringify({ projectId: selectedProjectId, creatorName: nextResult.creator.name, profileUrl: nextResult.creator.profileUrl, draftFileName: draftFile, draftContent: draft, verdict: nextResult.verdict, score: nextResult.score, result: nextResult }),
        }).then(() => loadReviews(selectedProjectId));
      }
    }, 1250);
  }

  function openSavedReview(review: SavedReview) {
    try {
      const savedResult = JSON.parse(review.resultJson) as ReviewResult;
      setResult(savedResult);
      setDraft(review.draftContent);
      setDraftFile(review.draftFileName);
      setOriginalDraftFile(null);
      setAcceptedIssues(savedResult.issues.map((_, index) => index));
      setExportMessage("历史记录未保存原 Word 文件，将根据归档正文生成新的带批注 DOCX。");
      setActiveTab("issues");
    } catch {
      setProjectMessage("该历史记录无法读取");
    }
  }

  function toggleIssue(index: number) {
    setAcceptedIssues((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
    setExportMessage("");
  }

  async function exportReviewDocx() {
    if (!result || !acceptedIssues.length) return;
    setIsExporting(true);
    setExportMessage("正在把已采纳建议写入 Word 批注…");
    try {
      const selected = result.issues.filter((_, index) => acceptedIssues.includes(index));
      const blob = await exportAnnotatedDraft(originalDraftFile, draft, selected, `${projectName} · ${result.creator.name} · 审核批注稿`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const baseName = (draftFile || `${result.creator.name}-达人稿件`).replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|]/g, "-");
      link.href = url;
      link.download = `${baseName}-仟传审核批注稿.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExportMessage(`已核验并导出 ${selected.length} 条独立批注。请用 Word/WPS 打开，在「审阅 → 显示批注」中查看；系统快速预览通常不显示批注。`);
    } catch (error) {
      setExportMessage(error instanceof Error ? error.message : "批注稿导出失败");
    } finally {
      setIsExporting(false);
    }
  }

  const p0Count = result?.issues.filter((item) => item.priority === "P0").length ?? 0;
  const p1Count = result?.issues.filter((item) => item.priority === "P1").length ?? 0;

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="仟传小省力首页"><span className="brand__stamp">仟</span><span><strong>仟传小省力</strong><small>KOL CONTENT REVIEW</small></span></a>
        <div className="topbar__meta"><span className="status-dot">工作台在线</span><span className="divider" /><span>项目草稿 #0726</span><button className="ghost-button" type="button" onClick={loadDemo}>载入演示案例</button></div>
      </header>

      <section className="hero" id="top">
        <div><p className="eyebrow"><span>01</span> 仟传小省力 · 达人稿件审核</p><h1>一个项目，一份 Brief，<br />持续汇总<span>所有达人稿件。</span></h1></div>
        <div className="hero__note"><span className="hero__line" /><p>第一次创建项目时保存 Brief；以后选择同一项目，只需上传新的达人稿件，审核结果会自动归档汇总。</p></div>
      </section>

      <section className="workspace">
        <aside className="intake-panel">
          <div className="panel-heading"><div><p className="eyebrow"><span>02</span> 项目与稿件</p><h2>{selectedProjectId ? projectName : "创建审核项目"}</h2></div><span className="readiness">{readiness}/2 已填写</span></div>

          <div className="project-switcher">
            <div><label htmlFor="project-select">已有项目</label><select id="project-select" value={selectedProjectId ?? ""} onChange={(event) => { const project = projects.find((item) => item.id === Number(event.target.value)); if (project) selectProject(project); }}><option value="">选择已保存项目</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}（{project.reviewCount}篇）</option>)}</select></div>
            <button type="button" onClick={startNewProject}>＋ 新建项目</button>
          </div>
          <div className="demo-files"><span>Max Mara 演示附件</span><a href="/demo/max-mara-ss26-brief.pdf" target="_blank" rel="noreferrer">Brief PDF</a><a href="/demo/island-whitenoise-script.pdf" target="_blank" rel="noreferrer">达人稿 PDF</a><a href="/demo/max-mara-review-report.pdf" target="_blank" rel="noreferrer">审核报告 PDF</a><a href="/api/demo-annotated?v=maxmara-color-comments-v2">批注稿 DOCX</a></div>
          <div className="field-row">
            <fieldset><legend>投放平台</legend><div className="segmented">{(["小红书", "抖音"] as Platform[]).map((item) => <button key={item} type="button" className={platform === item ? "active" : ""} onClick={() => { setPlatform(item); setContentType(item === "小红书" ? "图文笔记" : "短视频脚本"); setResult(null); }}>{item}</button>)}</div></fieldset>
            <fieldset><legend>内容形式</legend><select value={contentType} onChange={(event) => setContentType(event.target.value as ContentType)}><option>{platform === "小红书" ? "图文笔记" : "短视频脚本"}</option><option>{platform === "小红书" ? "视频笔记" : "剧情脚本"}</option></select></fieldset>
          </div>

          <div className="material-block">
            <div className="material-title"><span>01</span><div><h3>项目名称与固定 Brief</h3><p>首次保存后，同项目的新稿件可直接复用</p></div></div>
            <label className="text-label" htmlFor="project-name">项目名称</label>
            <input className="project-name-input" id="project-name" value={projectName} onChange={(event) => { setProjectName(event.target.value); setProjectMessage(""); }} placeholder="例：森屿实验室 · 夏季修护种草" />
            <FileUpload id="brief-file" label="上传 Brief" hint="支持 DOCX / PDF / TXT / MD" fileName={briefFile} onChange={(event) => readUpload(event, setBriefFile, setBrief)} />
            <textarea aria-label="Brief 内容" value={brief} onChange={(event) => { setBrief(event.target.value); setResult(null); }} placeholder="或直接粘贴 Brief：品牌、产品、核心卖点、必带词、禁用词、行动引导……" />
            <div className="project-save-row"><span className={projectMessage.includes("失败") || projectMessage.includes("存在") ? "error" : ""}>{projectMessage || "项目与 Brief 将保存在当前工作区"}</span><button type="button" disabled={isSavingProject || !projectName.trim() || !brief.trim()} onClick={saveProject}>{isSavingProject ? "保存中…" : selectedProjectId ? "更新项目 Brief" : "保存项目"}</button></div>
          </div>

          <div className="material-block">
            <div className="material-title"><span>02</span><div><h3>待审核稿件</h3><p>稿件中需包含达人姓名与小红书主页链接</p></div></div>
            <FileUpload id="draft-file" label="上传待审稿件" hint="DOCX / TXT / MD 可自动读取；DOCX 可保留排版导出批注" fileName={draftFile} onChange={handleDraftUpload} />
            <textarea className="draft-textarea" aria-label="待审核稿件" value={draft} onChange={(event) => { setDraft(event.target.value); setResult(null); }} placeholder={'建议在稿件开头注明：\n达人：@昵称\n小红书主页：https://www.xiaohongshu.com/user/profile/...\n\n再粘贴完整稿件内容'} />
            <div className={`creator-detect ${detectedCreator.found ? "creator-detect--ready" : ""}`}>
              <div><span className="creator-detect__icon">{detectedCreator.found ? "✓" : "?"}</span><strong>{detectedCreator.found ? detectedCreator.name : "等待识别达人"}</strong></div>
              <p>{detectedCreator.found ? "主页链接已识别 · 审核时将建立达人风格基线" : "需要同时识别达人姓名与完整主页链接，避免同名账号误判"}</p>
            </div>
          </div>

          <div className="auto-flow">
            <p className="auto-flow__title"><span>自动步骤</span> 达人研究将成为审核的一部分</p>
            <ol><li><b>1</b>识别达人主页</li><li><b>2</b>读取近期公开内容</li><li><b>3</b>提炼稳定风格与爆文结构</li><li><b>4</b>比对当前大纲</li></ol>
            <small>正式采集预计 2 次外部调用，产生费用前需人工确认。当前公开演示站不保存采集密钥。</small>
          </div>

          <div className="submit-row"><span>{isReviewing ? reviewStage : selectedProjectId ? `审核后自动归档到「${projectName}」` : "请先保存或选择项目"}</span><button className="primary-button" type="button" disabled={!canReview || isReviewing} onClick={runReview}>{isReviewing ? "分析中…" : "识别达人并审核"}<i aria-hidden="true">→</i></button></div>
        </aside>

        <section className="result-panel" aria-live="polite">
          <div className="result-header"><div><p className="eyebrow"><span>03</span> 项目稿件汇总</p><h2>{result ? result.verdict : selectedProjectId ? `${history.length} 篇稿件已归档` : "等待选择项目"}</h2></div>{result && <div className="score"><strong>{result.score}</strong><span>/ 100<br />综合评分</span></div>}</div>

          {selectedProjectId && <div className="project-history"><div className="project-history__head"><strong>{projectName}</strong><span>{history.length} 篇审核记录</span></div>{history.length ? <div className="history-list">{history.slice(0, 8).map((review) => <button type="button" key={review.id} onClick={() => openSavedReview(review)}><span className="history-avatar">{review.creatorName.slice(0, 1)}</span><span><strong>{review.creatorName}</strong><small>{new Date(review.createdAt.replace(" ", "T") + "Z").toLocaleDateString("zh-CN")} · {review.verdict}</small></span><b>{review.score}</b></button>)}</div> : <p>该项目还没有达人稿件，上传第一篇开始审核。</p>}</div>}

          {!result ? (
            <div className="empty-result"><div className="empty-result__seal">审</div><h3>{selectedProjectId ? "上传下一篇达人稿件" : "先创建或选择项目"}</h3><p>{selectedProjectId ? "项目 Brief 已自动载入，新稿件审核后会加入上方汇总。" : "项目只需配置一次 Brief，后续可持续汇总不同达人的稿件。"}</p><ol><li><span>1</span> 项目保存固定 Brief</li><li><span>2</span> 新稿件自动识别达人风格</li><li><span>3</span> 全部审核记录按项目汇总</li></ol></div>
          ) : (
            <>
              <div className="creator-summary"><div><span className="creator-avatar">{result.creator.name.slice(0, 1)}</span><div><small>已识别达人</small><strong>{result.creator.name}</strong></div></div><div className={`source-badge ${result.style.status !== "待连接授权采集服务" ? "source-badge--demo" : ""}`}>{result.style.status}</div></div>
              <div className="summary-strip"><div><span className="priority priority--p0">P0</span><strong>{p0Count}</strong><small>红线问题</small></div><div><span className="priority priority--p1">P1</span><strong>{p1Count}</strong><small>必须修改</small></div><div><span className="priority priority--p2">P2</span><strong>{result.issues.length - p0Count - p1Count}</strong><small>建议优化</small></div><div><span className="check-mark">风</span><strong>{result.style.matchScore ?? "—"}</strong><small>大纲风格匹配</small></div></div>
              <nav className="result-tabs" aria-label="审核结果分类"><button type="button" className={activeTab === "issues" ? "active" : ""} onClick={() => setActiveTab("issues")}>问题清单</button><button type="button" className={activeTab === "style" ? "active" : ""} onClick={() => setActiveTab("style")}>达人风格</button><button type="button" className={activeTab === "brief" ? "active" : ""} onClick={() => setActiveTab("brief")}>Brief 对照</button><button type="button" className={activeTab === "rewrite" ? "active" : ""} onClick={() => setActiveTab("rewrite")}>完整优化稿</button></nav>
              <div className="result-content">
                {activeTab === "issues" && <div className="issue-list">{result.issues.length === 0 ? <div className="all-clear">未检出规则风险，请继续人工核验事实、素材授权与平台最新要求。</div> : result.issues.map((issue, index) => <article className={`issue-card ${acceptedIssues.includes(index) ? "issue-card--accepted" : ""}`} key={`${issue.title}-${index}`}><div className="issue-card__top"><span className={`priority priority--${issue.priority.toLowerCase()}`}>{issue.priority}</span><small>问题 {String(index + 1).padStart(2, "0")}</small></div><h3>{issue.title}</h3><blockquote>“{issue.quote}”</blockquote><p>{issue.reason}</p><div className="suggestion"><strong>建议修改</strong><span>{issue.suggestion}</span></div><button className="accept-suggestion" type="button" aria-pressed={acceptedIssues.includes(index)} onClick={() => toggleIssue(index)}><span>{acceptedIssues.includes(index) ? "✓" : "+"}</span>{acceptedIssues.includes(index) ? "已采纳，将写入批注" : "采纳此建议"}</button></article>)}</div>}

                {activeTab === "style" && <div className="style-report">
                  <div className="style-overview"><div><small>样本范围</small><strong>{result.style.range}</strong><p>{result.style.sampleCount ? `已分析 ${result.style.sampleCount} 篇公开内容` : "接入授权采集服务后生成真实基线"}</p></div><div className="style-score"><strong>{result.style.matchScore ?? "—"}</strong><span>{result.style.matchScore === null ? "待采集" : "/ 100"}</span></div></div>
                  <section><div className="section-label">稳定内容风格</div><div className="trait-list">{result.style.traits.map((trait) => <span key={trait}>{trait}</span>)}</div></section>
                  <section><div className="section-label">近期爆文形式</div>{result.style.viralPatterns.length ? <div className="viral-list">{result.style.viralPatterns.map((item) => <article key={item.title}><div><strong>{item.title}</strong><span>{item.engagement}</span></div><p>{item.structure}</p></article>)}</div> : <div className="pending-data">等待采集后展示代表笔记、互动数据与结构拆解；不会把单篇爆文当作长期规律。</div>}</section>
                  <section><div className="section-label">当前大纲匹配</div><div className="outline-list">{result.style.outlineChecks.map((check) => <div key={check.item}><strong>{check.item}</strong><span className={`outline-status outline-status--${check.status}`}>{check.status}</span><p>{check.evidence}</p></div>)}</div></section>
                  <div className="style-verdict"><strong>判断</strong><p>{result.style.verdict}</p></div>
                </div>}

                {activeTab === "brief" && <div className="brief-table"><div className="brief-table__head"><span>Brief 要求</span><span>审核状态</span><span>提取依据</span></div>{result.matches.map((match) => <div className="brief-table__row" key={match.label}><strong>{match.label}</strong><span className={`match match--${match.status}`}>{match.status}</span><p>{match.evidence}</p></div>)}</div>}
                {activeTab === "rewrite" && <div className="rewrite-card"><div className="rewrite-card__meta"><span>{platform} · {contentType}</span><button type="button" onClick={() => navigator.clipboard?.writeText(result.optimized)}>复制优化稿</button></div><pre>{result.optimized}</pre><div className="human-check"><strong>发布前人工确认</strong><p>产品参数、活动价格、素材授权、商业合作标识及平台最新规则。</p></div><section className="export-step"><div className="export-step__heading"><span>04</span><div><strong>采纳建议并导出批注稿</strong><p>已选 {acceptedIssues.length} / {result.issues.length} 条建议；每条问题都会生成一条独立批注，下载前自动核对数量。</p></div></div><button className="export-button" type="button" disabled={isExporting || !acceptedIssues.length} onClick={exportReviewDocx}>{isExporting ? "正在核对并生成…" : `导出 ${acceptedIssues.length} 条 Word 批注`}<i aria-hidden="true">↓</i></button><small className="export-tip">原稿为 DOCX 时保留排版。请用 Word/WPS 的「审阅 → 显示批注」查看，系统快速预览不会显示批注。</small>{exportMessage && <p className={`export-message ${exportMessage.includes("失败") || exportMessage.includes("无法") ? "export-message--error" : ""}`}>{exportMessage}</p>}</section></div>}
              </div>
            </>
          )}
        </section>
      </section>
      <footer><span>QIANCHUAN / KOL REVIEW DESK</span><p>仟传小省力 · 达人稿件审核</p><span>V1.3 · 批注稿导出</span></footer>
    </main>
  );
}
