import { getD1 } from "../../../db/d1";

function workspaceId(request: Request) {
  const value = request.headers.get("x-workspace-id")?.trim() ?? "";
  return /^[a-zA-Z0-9-]{12,80}$/.test(value) ? value : null;
}

export async function GET(request: Request) {
  const workspace = workspaceId(request);
  if (!workspace) return Response.json({ error: "workspace is required" }, { status: 400 });
  try {
    const db = getD1();
    const result = await db.prepare(`
      SELECT p.id, p.name, p.platform, p.brief, p.created_at AS createdAt,
             p.updated_at AS updatedAt, COUNT(r.id) AS reviewCount
      FROM projects p
      LEFT JOIN reviews r ON r.project_id = p.id AND r.workspace_id = p.workspace_id
      WHERE p.workspace_id = ?
      GROUP BY p.id
      ORDER BY p.updated_at DESC, p.id DESC
    `).bind(workspace).all();
    return Response.json({ projects: result.results ?? [] });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "读取项目失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const workspace = workspaceId(request);
  if (!workspace) return Response.json({ error: "workspace is required" }, { status: 400 });
  try {
    const payload = await request.json() as { name?: string; brief?: string; platform?: string };
    const name = payload.name?.trim() ?? "";
    const brief = payload.brief?.trim() ?? "";
    if (!name || !brief) return Response.json({ error: "项目名称和 Brief 为必填项" }, { status: 400 });
    const db = getD1();
    const project = await db.prepare(`
      INSERT INTO projects (workspace_id, name, platform, brief)
      VALUES (?, ?, ?, ?)
      RETURNING id, name, platform, brief, created_at AS createdAt, updated_at AS updatedAt
    `).bind(workspace, name, payload.platform || "小红书", brief).first();
    return Response.json({ project: { ...project, reviewCount: 0 } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建项目失败";
    const friendly = /UNIQUE|unique/i.test(message) ? "该项目名称已经存在" : message;
    return Response.json({ error: friendly }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const workspace = workspaceId(request);
  if (!workspace) return Response.json({ error: "workspace is required" }, { status: 400 });
  try {
    const payload = await request.json() as { id?: number; name?: string; brief?: string; platform?: string };
    if (!payload.id || !payload.name?.trim() || !payload.brief?.trim()) return Response.json({ error: "项目信息不完整" }, { status: 400 });
    const db = getD1();
    const project = await db.prepare(`
      UPDATE projects SET name = ?, platform = ?, brief = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND workspace_id = ?
      RETURNING id, name, platform, brief, created_at AS createdAt, updated_at AS updatedAt
    `).bind(payload.name.trim(), payload.platform || "小红书", payload.brief.trim(), payload.id, workspace).first();
    if (!project) return Response.json({ error: "项目不存在" }, { status: 404 });
    return Response.json({ project });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "更新项目失败" }, { status: 500 });
  }
}
