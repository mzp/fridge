ALTER TABLE `meals` RENAME COLUMN "name" TO "main_dish";--> statement-breakpoint
ALTER TABLE `meals` ADD `side_dish` text;