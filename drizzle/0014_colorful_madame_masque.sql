CREATE TABLE `emailLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int,
	`registrationId` int,
	`templateType` enum('approval','rejection','pending','purchase','confirmation'),
	`recipient` varchar(320) NOT NULL,
	`subject` varchar(200) NOT NULL,
	`status` enum('sent','failed','pending') NOT NULL DEFAULT 'pending',
	`error` text,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` enum('smtp','sendgrid','ses','resend') NOT NULL,
	`smtpHost` varchar(255),
	`smtpPort` int,
	`smtpUser` varchar(255),
	`smtpPassword` text,
	`smtpSecure` tinyint DEFAULT 1,
	`apiKey` text,
	`awsRegion` varchar(50),
	`awsAccessKey` varchar(255),
	`awsSecretKey` text,
	`senderEmail` varchar(320) NOT NULL,
	`senderName` varchar(100) NOT NULL,
	`replyToEmail` varchar(320),
	`enabled` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`templateType` enum('approval','rejection','pending','purchase','confirmation') NOT NULL,
	`subject` varchar(200) NOT NULL,
	`htmlBody` text NOT NULL,
	`attachmentFormat` enum('jpg','pdf','none') NOT NULL DEFAULT 'none',
	`enabled` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `emailLogs` ADD CONSTRAINT `emailLogs_eventId_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailLogs` ADD CONSTRAINT `emailLogs_registrationId_registrations_id_fk` FOREIGN KEY (`registrationId`) REFERENCES `registrations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailTemplates` ADD CONSTRAINT `emailTemplates_eventId_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;