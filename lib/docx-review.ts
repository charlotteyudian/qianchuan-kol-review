import JSZip from "jszip";

export type ExportIssue = {
  priority: string;
  title: string;
  quote: string;
  reason: string;
  suggestion: string;
};

const COMMENTS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments";
const COMMENTS_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml";

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function paragraphText(paragraphXml: string) {
  return [...paragraphXml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)]
    .map((match) => decodeXml(match[1]))
    .join("");
}

function normalizedAnchor(value: string) {
  return value
    .replace(/^(?:结尾|开头|标题|原文)[：:]\s*/u, "")
    .replace(/[“”"'‘’]/g, "")
    .trim();
}

function addCommentsToParagraph(paragraphXml: string, ids: number[]) {
  const anchors = ids.map((id) => `<w:commentRangeStart w:id="${id}"/><w:commentRangeEnd w:id="${id}"/><w:r><w:rPr><w:rStyle w:val="CommentReference"/></w:rPr><w:commentReference w:id="${id}"/></w:r>`).join("");
  return paragraphXml.replace(/<\/w:p>$/, `${anchors}</w:p>`);
}

function markParagraphRuns(paragraphXml: string) {
  return paragraphXml.replace(/<w:r(?:\s[^>]*)?>[\s\S]*?<\/w:r>/g, (originalRun) => {
    if (!/<w:t(?:\s[^>]*)?>/.test(originalRun)) return originalRun;
    const run = originalRun
      .replace(/<w:color\b[^>]*\/>/g, "")
      .replace(/<w:highlight\b[^>]*\/>/g, "");
    const marker = '<w:color w:val="C00000"/><w:highlight w:val="yellow"/>';
    if (/<w:rPr(?:\s[^>]*)?>/.test(run)) {
      return run.replace(/(<w:rPr(?:\s[^>]*)?>)/, `$1${marker}`);
    }
    return run.replace(/^(<w:r(?:\s[^>]*)?>)/, `$1<w:rPr>${marker}</w:rPr>`);
  });
}

function commentParagraphXml(label: string, value: string, color: string, includeAnnotation = false) {
  const annotation = includeAnnotation ? "<w:annotationRef/>" : "";
  return `<w:p><w:r><w:rPr><w:b/><w:color w:val="${color}"/></w:rPr>${annotation}<w:t xml:space="preserve">${escapeXml(label)}</w:t></w:r><w:r><w:rPr><w:color w:val="${color}"/></w:rPr><w:t xml:space="preserve">${escapeXml(value)}</w:t></w:r></w:p>`;
}

function makeCommentXml(id: number, issue: ExportIssue) {
  const body = [
    commentParagraphXml("原文 / 大纲：", issue.quote, "C00000", true),
    commentParagraphXml("审核问题：", `[${issue.priority}] ${issue.title}`, "C00000"),
    commentParagraphXml("批注建议：", issue.suggestion, "1F4E78"),
    commentParagraphXml("审核依据：", issue.reason, "666666"),
  ].join("");
  return `<w:comment w:id="${id}" w:author="仟传小省力" w:initials="仟传" w:date="${new Date().toISOString()}">${body}</w:comment>`;
}

export async function extractDocxText(file: File) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) throw new Error("未识别到有效的 Word 正文");
  const xml = await documentFile.async("string");
  return [...xml.matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g)]
    .map((match) => paragraphText(match[0]).trim())
    .filter(Boolean)
    .join("\n\n");
}

async function annotateExistingDocx(file: File, issues: ExportIssue[]) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) throw new Error("原文件不是有效的 DOCX 文档");

  let documentXml = await documentFile.async("string");
  const paragraphs = [...documentXml.matchAll(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g)].map((match) => ({
    xml: match[0],
    index: match.index ?? 0,
    text: paragraphText(match[0]),
  }));
  const usable = paragraphs.filter((paragraph) => paragraph.text.trim());
  if (!usable.length) throw new Error("原 Word 文档没有可批注的正文");

  const commentsFile = zip.file("word/comments.xml");
  let commentsXml = commentsFile ? await commentsFile.async("string") : "";
  const existingIds = [...commentsXml.matchAll(/w:id="(\d+)"/g)].map((match) => Number(match[1]));
  let nextId = existingIds.length ? Math.max(...existingIds) + 1 : 0;

  const groups = new Map<number, Array<{ id: number; issue: ExportIssue }>>();
  issues.forEach((issue, issueIndex) => {
    const anchor = normalizedAnchor(issue.quote);
    let target = anchor && !/^(全文|稿件抬头\/备注)$/u.test(anchor)
      ? usable.find((paragraph) => paragraph.text.includes(anchor))
      : undefined;
    if (!target) target = usable[Math.min(issueIndex, usable.length - 1)];
    const group = groups.get(target.index) ?? [];
    group.push({ id: nextId++, issue });
    groups.set(target.index, group);
  });

  const additions: string[] = [];
  const replacements = [...groups.entries()].map(([index, groupedIssues]) => {
    const paragraph = paragraphs.find((item) => item.index === index)!;
    groupedIssues.forEach(({ id, issue }) => additions.push(makeCommentXml(id, issue)));
    const markedParagraph = markParagraphRuns(paragraph.xml);
    return { index, oldLength: paragraph.xml.length, xml: addCommentsToParagraph(markedParagraph, groupedIssues.map((item) => item.id)) };
  }).sort((a, b) => b.index - a.index);

  replacements.forEach((replacement) => {
    documentXml = `${documentXml.slice(0, replacement.index)}${replacement.xml}${documentXml.slice(replacement.index + replacement.oldLength)}`;
  });
  zip.file("word/document.xml", documentXml);

  if (commentsXml) {
    commentsXml = commentsXml.includes("</w:comments>")
      ? commentsXml.replace(/<\/w:comments>\s*$/, `${additions.join("")}</w:comments>`)
      : commentsXml.replace(/\/>\s*$/, `>${additions.join("")}</w:comments>`);
  } else {
    commentsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${additions.join("")}</w:comments>`;
  }
  zip.file("word/comments.xml", commentsXml);

  const relsPath = "word/_rels/document.xml.rels";
  const relsFile = zip.file(relsPath);
  if (!relsFile) throw new Error("原 Word 文档结构不完整");
  let relsXml = await relsFile.async("string");
  if (!relsXml.includes(COMMENTS_REL)) {
    const relIds = [...relsXml.matchAll(/Id="rId(\d+)"/g)].map((match) => Number(match[1]));
    const nextRel = relIds.length ? Math.max(...relIds) + 1 : 1;
    relsXml = relsXml.replace(/<\/Relationships>\s*$/, `<Relationship Id="rId${nextRel}" Type="${COMMENTS_REL}" Target="comments.xml"/></Relationships>`);
    zip.file(relsPath, relsXml);
  }

  const contentTypesFile = zip.file("[Content_Types].xml");
  if (!contentTypesFile) throw new Error("原 Word 文档结构不完整");
  let contentTypesXml = await contentTypesFile.async("string");
  if (!contentTypesXml.includes(COMMENTS_CONTENT_TYPE)) {
    contentTypesXml = contentTypesXml.replace(/<\/Types>\s*$/, `<Override PartName="/word/comments.xml" ContentType="${COMMENTS_CONTENT_TYPE}"/></Types>`);
    zip.file("[Content_Types].xml", contentTypesXml);
  }

  const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  await validateAnnotatedDocx(blob, issues.length);
  return blob;
}

async function createAnnotatedDocx(draft: string, issues: ExportIssue[], title: string) {
  const { CommentRangeEnd, CommentRangeStart, CommentReference, Document, HighlightColor, Packer, Paragraph, TextRun } = await import("docx");
  const lines = draft.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const grouped = new Map<number, Array<{ id: number; issue: ExportIssue }>>();
  const comments: Array<{ id: number; author: string; initials: string; date: Date; children: InstanceType<typeof Paragraph>[] }> = [];
  issues.forEach((issue, issueIndex) => {
    const anchor = normalizedAnchor(issue.quote);
    let lineIndex = anchor && !/^(全文|稿件抬头\/备注)$/u.test(anchor) ? lines.findIndex((line) => line.includes(anchor)) : -1;
    if (lineIndex < 0) lineIndex = Math.min(issueIndex, Math.max(lines.length - 1, 0));
    const id = comments.length;
    comments.push({
      id,
      author: "仟传小省力",
      initials: "仟传",
      date: new Date(),
      children: [
        new Paragraph({ children: [
          new TextRun({ text: "原文 / 大纲：", font: "Arial Unicode MS", size: 20, bold: true, color: "C00000" }),
          new TextRun({ text: issue.quote, font: "Arial Unicode MS", size: 20, color: "C00000" }),
        ] }),
        new Paragraph({ children: [
          new TextRun({ text: "审核问题：", font: "Arial Unicode MS", size: 20, bold: true, color: "C00000" }),
          new TextRun({ text: `[${issue.priority}] ${issue.title}`, font: "Arial Unicode MS", size: 20, color: "C00000" }),
        ] }),
        new Paragraph({ children: [
          new TextRun({ text: "批注建议：", font: "Arial Unicode MS", size: 20, bold: true, color: "1F4E78" }),
          new TextRun({ text: issue.suggestion, font: "Arial Unicode MS", size: 20, color: "1F4E78" }),
        ] }),
        new Paragraph({ children: [
          new TextRun({ text: "审核依据：", font: "Arial Unicode MS", size: 20, bold: true, color: "666666" }),
          new TextRun({ text: issue.reason, font: "Arial Unicode MS", size: 20, color: "666666" }),
        ] }),
      ],
    });
    grouped.set(lineIndex, [...(grouped.get(lineIndex) ?? []), { id, issue }]);
  });

  const children = [new Paragraph({ children: [new TextRun({ text: title, font: "Arial Unicode MS", size: 44, bold: true, color: "5A2E1F" })], spacing: { after: 240 } })];
  lines.forEach((line, index) => {
    const groupedIssues = grouped.get(index);
    if (!groupedIssues) {
      children.push(new Paragraph({ children: [new TextRun({ text: line, font: "Arial Unicode MS", size: 22 })], spacing: { after: 120, line: 300 } }));
      return;
    }
    const commentAnchors = groupedIssues.flatMap(({ id }) => [new CommentRangeStart(id), new CommentRangeEnd(id), new CommentReference(id)]);
    children.push(new Paragraph({ children: [new TextRun({ text: line, font: "Arial Unicode MS", size: 22, color: "C00000", highlight: HighlightColor.YELLOW }), ...commentAnchors], spacing: { after: 120, line: 300 } }));
  });

  const document = new Document({
    creator: "仟传小省力",
    title,
    styles: { default: { document: { run: { font: "Arial Unicode MS", size: 22 }, paragraph: { spacing: { after: 120, line: 300 } } } } },
    comments: { children: comments },
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440, header: 708, footer: 708 } } }, children }],
  });
  const blob = await Packer.toBlob(document);
  await validateAnnotatedDocx(blob, issues.length);
  return blob;
}

async function validateAnnotatedDocx(blob: Blob, expectedComments: number) {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const commentsXml = await zip.file("word/comments.xml")?.async("string") ?? "";
  const documentXml = await zip.file("word/document.xml")?.async("string") ?? "";
  const commentCount = [...commentsXml.matchAll(/<w:comment\b/g)].length;
  const referenceCount = [...documentXml.matchAll(/<w:commentReference\b/g)].length;
  if (commentCount < expectedComments || referenceCount < expectedComments) {
    throw new Error(`批注写入校验失败：应有 ${expectedComments} 条，实际写入 ${Math.min(commentCount, referenceCount)} 条`);
  }
}

export async function exportAnnotatedDraft(file: File | null, draft: string, issues: ExportIssue[], title: string) {
  if (!issues.length) throw new Error("当前没有可采纳的审核建议");
  if (file && /\.pdf$/i.test(file.name)) throw new Error("PDF 无法直接写入 Word 批注，请上传原始 DOCX，或粘贴正文后再导出新 Word 稿");
  if (file && /\.docx$/i.test(file.name)) return annotateExistingDocx(file, issues);
  return createAnnotatedDocx(draft, issues, title);
}
