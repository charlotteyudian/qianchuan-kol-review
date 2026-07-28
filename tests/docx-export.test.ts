import assert from "node:assert/strict";
import test from "node:test";
import { Document, Packer, Paragraph } from "docx";
import JSZip from "jszip";
import { exportAnnotatedDraft, extractDocxText } from "../lib/docx-review.ts";

test("preserves a source docx and adds WPS-compatible tracked revisions", async () => {
  const source = new Document({
    sections: [{
      children: [
        new Paragraph("达人：@阿栗的浴室日记"),
        new Paragraph("所有损伤都能修复，效果永久。"),
        new Paragraph("现在还是全网最低价，闭眼冲！"),
      ],
    }],
  });
  const sourceBlob = new Blob([await Packer.toBuffer(source)], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  const file = new File([sourceBlob], "达人原稿.docx", { type: sourceBlob.type });
  const extracted = await extractDocxText(file);
  assert.match(extracted, /所有损伤都能修复/);

  const output = await exportAnnotatedDraft(file, extracted, [
    {
      priority: "P0",
      title: "绝对化功效表达",
      quote: "所有损伤",
      reason: "缺少普遍效果依据。",
      suggestion: "改为具体使用感受。",
    },
    {
      priority: "P2",
      title: "语气过度承诺",
      quote: "效果永久",
      reason: "达人体验缺少边界。",
      suggestion: "增加个体差异说明。",
    },
  ], "审核修订稿");
  const zip = await JSZip.loadAsync(await output.arrayBuffer());
  const comments = await zip.file("word/comments.xml")?.async("string");
  const documentXml = await zip.file("word/document.xml")?.async("string");
  const settingsXml = await zip.file("word/settings.xml")?.async("string");
  const rels = await zip.file("word/_rels/document.xml.rels")?.async("string");

  assert.match(comments ?? "", /仟传小省力/);
  assert.match(comments ?? "", /改为具体使用感受/);
  assert.match(comments ?? "", /增加个体差异说明/);
  assert.match(comments ?? "", /原文 \/ 大纲/);
  assert.match(comments ?? "", /审核问题/);
  assert.match(comments ?? "", /批注建议/);
  assert.match(comments ?? "", /审核依据/);
  assert.match(comments ?? "", /w:val="1F4E78"/);
  assert.equal([...(comments ?? "").matchAll(/<w:comment\b/g)].length, 2);
  assert.equal([...(documentXml ?? "").matchAll(/<w:commentReference\b/g)].length, 2);
  assert.equal([...(documentXml ?? "").matchAll(/<w:ins\b/g)].length, 2);
  assert.equal([...(documentXml ?? "").matchAll(/<w:del\b/g)].length, 2);
  assert.match(documentXml ?? "", /<w:delText[^>]*>所有损伤<\/w:delText>/);
  assert.match(documentXml ?? "", /<w:delText[^>]*>效果永久<\/w:delText>/);
  assert.match(documentXml ?? "", /<w:ins\b[^>]*w:author="仟传小省力"/);
  assert.match(settingsXml ?? "", /<w:trackRevisions/);
  assert.match(documentXml ?? "", /w:color w:val="C00000"/);
  assert.match(documentXml ?? "", /w:strike/);
  assert.match(documentXml ?? "", /w:color w:val="1F4E78"/);
  assert.match(documentXml ?? "", /commentRangeStart/);
  assert.match(documentXml ?? "", /commentReference/);
  assert.match(rels ?? "", /relationships\/comments/);
});

test("creates a new WPS-compatible revision docx from pasted text", async () => {
  const draft = "达人：@阿栗\n所有损伤都能修复，效果永久。\n现在还是全网最低价。";
  const output = await exportAnnotatedDraft(null, draft, [{
    priority: "P0",
    title: "绝对化功效表达",
    quote: "所有损伤",
    reason: "缺少普遍效果依据。",
    suggestion: "改为具体使用感受。",
  }], "审核修订稿");
  const zip = await JSZip.loadAsync(await output.arrayBuffer());
  const comments = await zip.file("word/comments.xml")?.async("string");
  const documentXml = await zip.file("word/document.xml")?.async("string");
  const settingsXml = await zip.file("word/settings.xml")?.async("string");
  assert.match(comments ?? "", /仟传小省力/);
  assert.match(comments ?? "", /绝对化功效表达/);
  assert.match(comments ?? "", /原文 \/ 大纲/);
  assert.match(comments ?? "", /批注建议/);
  assert.match(comments ?? "", /w:val="1F4E78"/);
  assert.match(documentXml ?? "", /w:commentReference/);
  assert.match(documentXml ?? "", /<w:del\b/);
  assert.match(documentXml ?? "", /<w:delText[^>]*>所有损伤<\/w:delText>/);
  assert.match(documentXml ?? "", /<w:ins\b/);
  assert.match(settingsXml ?? "", /<w:trackRevisions/);
  assert.match(documentXml ?? "", /w:color w:val="C00000"/);
  assert.match(documentXml ?? "", /w:color w:val="1F4E78"/);
});

test("places an add-only ending suggestion at the end of the draft", async () => {
  const output = await exportAnnotatedDraft(null, "开头内容\n中间内容\n结尾原文", [{
    priority: "P1",
    title: "缺少品牌话题",
    quote: "脚本结尾",
    reason: "Brief 要求带品牌话题。",
    suggestion: "补入 #品牌话题。",
  }], "审核修订稿");
  const zip = await JSZip.loadAsync(await output.arrayBuffer());
  const documentXml = await zip.file("word/document.xml")?.async("string") ?? "";
  assert.ok(documentXml.indexOf("#品牌话题") > documentXml.indexOf("结尾原文"));
  assert.equal([...documentXml.matchAll(/<w:ins\b/g)].length, 1);
  assert.equal([...documentXml.matchAll(/<w:del\b/g)].length, 0);
});
