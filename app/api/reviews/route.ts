import { getD1 } from "../../../db/d1";

function workspaceId(request: Request) {
  const value = request.headers.get("x-workspace-id")?.trim() ?? "";
  return /^[a-zA-Z0-9-]{12,80}$/.test(value) ? value : null;
}

export async function GET(request: Request) {
  const workspace = workspaceId(request);
  const projectId = Number(new URL(request.url).searchParams.get("projectId"));
  if (!workspace || !projectId) return Response.json({ error: "workspace and projectId are required" }, { status: 400 });
  try {
    const db = getD1();
    const result = await db.prepare(`
      SELECT id, project_id AS projectId, creator_name AS creatorName, profile_url AS profileUrl,
             draft_file_name AS draftFileName, draft_content AS draftContent, verdict, score, result_json AS resultJson,
             created_at AS createdAt
      FROM reviews WHERE workspace_id = ? AND project_id = ?
      ORDER BY created_at DESC, id DESC LIMIT 100
    `).bind(workspace, projectId).all();
    return Response.json({ reviews: result.results ?? [] });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "读取稿件记录失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const workspace = workspaceId(request);
  if (!workspace) return Response.json({ error: "workspace is required" }, { status: 400 });
  try {
    const payload = await request.json() as {
      projectId?: number; creatorName?: string; profileUrl?: string; draftFileName?: string;
      draftContent?: string; verdict?: string; score?: number; result?: unknown;
    };
    if (!payload.projectId || !payload.draftContent || !payload.verdict || typeof payload.score !== "number") {
      return Response.json({ error: "稿件审核数据不完整" }, { status: 400 });
    }
    const db = getD1();
    const owned = await db.prepare("SELECT id FROM projects WHERE id = ? AND workspace_id = ?").bind(payload.projectId, workspace).first();
    if (!owned) return Response.json({ error: "项目不存在" }, { status: 404 });
    const review = await db.prepare(`
      INSERT INTO reviews (workspace_id, project_id, creator_name, profile_url, draft_file_name, draft_content, verdict, score, result_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id, project_id AS projectId, creator_name AS creatorName, profile_url AS profileUrl,
                draft_file_name AS draftFileName, verdict, score, result_json AS resultJson, created_at AS createdAt
    `).bind(
      workspace, payload.projectId, payload.creatorName || "未识别达人", payload.profileUrl || "",
      payload.draftFileName || "", payload.draftContent, payload.verdict, payload.score, JSON.stringify(payload.result ?? {}),
    ).first();
    await db.prepare("UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ? AND workspace_id = ?").bind(payload.projectId, workspace).run();
    return Response.json({ review }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "保存稿件审核失败" }, { status: 500 });
  }
}
