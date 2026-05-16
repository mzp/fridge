CREATE TABLE `pantry_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pantry_id` integer NOT NULL,
	`delta` integer NOT NULL,
	`recorded_at` text NOT NULL,
	`note` text,
	FOREIGN KEY (`pantry_id`) REFERENCES `pantry`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
DROP INDEX `pantry_name_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `pantry_name_date_idx` ON `pantry` (`name`,`purchased_at`);