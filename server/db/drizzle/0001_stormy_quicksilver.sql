ALTER TABLE `games` RENAME COLUMN `win` TO `status`;--> statement-breakpoint
ALTER TABLE `games` MODIFY COLUMN `status` enum('unknown','win','lose');