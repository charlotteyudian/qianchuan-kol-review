import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workspaceId: text("workspace_id").notNull(),
  name: text("name").notNull(),
  platform: text("platform").notNull().default("小红书"),
  brief: text("brief").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("projects_workspace_name_unique").on(table.workspaceId, table.name),
  index("projects_workspace_updated_idx").on(table.workspaceId, table.updatedAt),
]);

export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workspaceId: text("workspace_id").notNull(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  creatorName: text("creator_name").notNull().default("未识别达人"),
  profileUrl: text("profile_url").notNull().default(""),
  draftFileName: text("draft_file_name").notNull().default(""),
  draftContent: text("draft_content").notNull(),
  verdict: text("verdict").notNull(),
  score: integer("score").notNull(),
  resultJson: text("result_json").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("reviews_workspace_project_created_idx").on(table.workspaceId, table.projectId, table.createdAt),
]);
