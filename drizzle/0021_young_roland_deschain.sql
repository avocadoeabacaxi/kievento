ALTER TABLE `registrations` ADD `emailSentCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `registrations` ADD `lastEmailSentAt` timestamp;