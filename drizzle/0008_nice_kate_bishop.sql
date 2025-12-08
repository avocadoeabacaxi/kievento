CREATE TABLE `ticketTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`price` varchar(50),
	`quantity` int,
	`quantitySold` int NOT NULL DEFAULT 0,
	`validFrom` timestamp,
	`validUntil` timestamp,
	`color` varchar(20) DEFAULT '#ef4444',
	`order` int NOT NULL DEFAULT 0,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ticketTypes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `registrations` ADD `ticketTypeId` int;--> statement-breakpoint
ALTER TABLE `ticketTypes` ADD CONSTRAINT `ticketTypes_eventId_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;