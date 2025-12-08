ALTER TABLE `events` DROP INDEX `events_slug_unique`;--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `slug` varchar(255);