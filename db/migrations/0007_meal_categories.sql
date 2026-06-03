CREATE TABLE `__new_meals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`rice` text,
	`main` text NOT NULL,
	`hot_side` text,
	`cold_side` text,
	`soup` text
);
--> statement-breakpoint
INSERT INTO `__new_meals`("id", "date", "rice", "main", "hot_side", "cold_side", "soup") SELECT "id", "date", NULL, "main_dish", "side_dish", NULL, NULL FROM `meals`;--> statement-breakpoint
DROP TABLE `meals`;--> statement-breakpoint
ALTER TABLE `__new_meals` RENAME TO `meals`;
