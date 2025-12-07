CREATE TABLE `eventValidators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int NOT NULL,
	`canScanQr` int NOT NULL DEFAULT 1,
	`canSearchName` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `eventValidators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`eventDate` timestamp NOT NULL,
	`address` text,
	`bannerUrl` text,
	`bannerKey` text,
	`registrationType` enum('open','approval') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `formFields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`label` varchar(255) NOT NULL,
	`fieldType` enum('text','email','phone','textarea','select','checkbox') NOT NULL,
	`options` text,
	`required` int NOT NULL DEFAULT 1,
	`order` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `formFields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`formData` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`qrCode` varchar(255),
	`checkedIn` int NOT NULL DEFAULT 0,
	`checkedInAt` timestamp,
	`checkedInBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `registrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `registrations_qrCode_unique` UNIQUE(`qrCode`)
);
--> statement-breakpoint
ALTER TABLE `eventValidators` ADD CONSTRAINT `eventValidators_eventId_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `eventValidators` ADD CONSTRAINT `eventValidators_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `formFields` ADD CONSTRAINT `formFields_eventId_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `registrations` ADD CONSTRAINT `registrations_eventId_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `registrations` ADD CONSTRAINT `registrations_checkedInBy_users_id_fk` FOREIGN KEY (`checkedInBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;