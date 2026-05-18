CREATE TABLE `__new_pantry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit` text,
	`stock_date` text,
	`best_before_days` integer,
	`status` text DEFAULT 'in_stock' NOT NULL,
	`category` text DEFAULT 'ingredient' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_pantry`("id", "name", "quantity", "unit", "stock_date", "best_before_days", "status", "category") SELECT "id", "name", "quantity", "unit", "stock_date", "best_before_days", "status", "category" FROM `pantry`;--> statement-breakpoint
DROP TABLE `pantry`;--> statement-breakpoint
ALTER TABLE `__new_pantry` RENAME TO `pantry`;--> statement-breakpoint
CREATE UNIQUE INDEX `pantry_name_date_idx` ON `pantry` (`name`,`stock_date`);