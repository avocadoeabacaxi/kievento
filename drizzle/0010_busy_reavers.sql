ALTER TABLE `events` ADD `slug` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_slug_unique` UNIQUE(`slug`);