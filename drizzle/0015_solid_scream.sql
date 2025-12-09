CREATE TABLE `eventCollaborators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('coordinator','supervisor','checkin') NOT NULL,
	`status` enum('pending','active') NOT NULL DEFAULT 'pending',
	`inviteToken` varchar(64) NOT NULL,
	`userId` int,
	`invitedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	CONSTRAINT `eventCollaborators_id` PRIMARY KEY(`id`),
	CONSTRAINT `eventCollaborators_inviteToken_unique` UNIQUE(`inviteToken`)
);
