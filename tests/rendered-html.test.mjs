import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("contains the branded KOL review workspace", async () => {
  const [workspace, layout, packageJson] = await Promise.all([
    readFile(new URL("app/review-workspace.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
  ]);

  assert.match(layout, /仟传小省力/);
  assert.match(workspace, /项目名称/);
  assert.match(workspace, /达人风格/);
  assert.match(workspace, /导出.*批注稿/s);
  assert.match(workspace, /Max Mara 演示附件/);
  assert.match(packageJson, /"name": "qianchuan-kol-review"/);
  assert.doesNotMatch(layout, /Starter Project/);
});

test("ships all Max Mara demonstration deliverables", async () => {
  await Promise.all([
    access(new URL("public/demo/max-mara-ss26-brief.pdf", root)),
    access(new URL("public/demo/island-whitenoise-script.pdf", root)),
    access(new URL("public/demo/max-mara-review-report.pdf", root)),
    access(new URL("public/demo/island-whitenoise-annotated.docx", root)),
  ]);
});
