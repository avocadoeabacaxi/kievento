ALTER TABLE `events` ADD `registrationDeadline` timestamp;--> statement-breakpoint
ALTER TABLE `events` ADD `hasTicketTypes` tinyint DEFAULT 0 NOT NULL;