CREATE TABLE `race_limits` (
	`key` text NOT NULL,
	`bucket` integer NOT NULL,
	`count` integer NOT NULL,
	PRIMARY KEY(`key`, `bucket`)
);
--> statement-breakpoint
CREATE TABLE `race_rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`version` integer NOT NULL,
	`snapshot` text NOT NULL,
	`expires_at` integer NOT NULL
);
