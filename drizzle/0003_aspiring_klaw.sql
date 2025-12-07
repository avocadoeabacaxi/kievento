ALTER TABLE `events` DROP FOREIGN KEY `events_userId_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `registrationType` enum('open','approval') NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `category` varchar(50);--> statement-breakpoint
ALTER TABLE `events` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `events` ADD `visibility` enum('public','private') DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `userType` enum('individual','company') DEFAULT 'individual';--> statement-breakpoint
ALTER TABLE `users` ADD `profilePhoto` text;--> statement-breakpoint
ALTER TABLE `users` ADD `profilePhotoKey` text;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `cpf` varchar(14);--> statement-breakpoint
ALTER TABLE `users` ADD `birthDate` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `cnpj` varchar(18);--> statement-breakpoint
ALTER TABLE `users` ADD `companyName` text;--> statement-breakpoint
ALTER TABLE `users` ADD `tradeName` text;--> statement-breakpoint
ALTER TABLE `users` ADD `address` text;--> statement-breakpoint
ALTER TABLE `users` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `state` varchar(2);--> statement-breakpoint
ALTER TABLE `users` ADD `zipCode` varchar(9);