CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`platform` text DEFAULT '小红书' NOT NULL,
	`brief` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_workspace_name_unique` ON `projects` (`workspace_id`,`name`);--> statement-breakpoint
CREATE INDEX `projects_workspace_updated_idx` ON `projects` (`workspace_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workspace_id` text NOT NULL,
	`project_id` integer NOT NULL,
	`creator_name` text DEFAULT '未识别达人' NOT NULL,
	`profile_url` text DEFAULT '' NOT NULL,
	`draft_file_name` text DEFAULT '' NOT NULL,
	`draft_content` text NOT NULL,
	`verdict` text NOT NULL,
	`score` integer NOT NULL,
	`result_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reviews_workspace_project_created_idx` ON `reviews` (`workspace_id`,`project_id`,`created_at`);