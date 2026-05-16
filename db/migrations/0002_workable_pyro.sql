CREATE TABLE `pantry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit` text,
	`purchased_at` text NOT NULL,
	`best_before_days` integer,
	`status` text DEFAULT 'in_stock' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pantry_name_idx` ON `pantry` (`name`);