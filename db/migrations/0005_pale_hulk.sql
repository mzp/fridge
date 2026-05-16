ALTER TABLE `pantry` RENAME COLUMN "purchased_at" TO "stock_date";--> statement-breakpoint
DROP INDEX `pantry_name_date_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `pantry_name_date_idx` ON `pantry` (`name`,`stock_date`);