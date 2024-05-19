CREATE TABLE `games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`win` boolean NOT NULL,
	CONSTRAINT `games_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_games` (
	`user_id` int NOT NULL,
	`game_id` int NOT NULL,
	CONSTRAINT `user_games_user_id_game_id_pk` PRIMARY KEY(`user_id`,`game_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(256) NOT NULL,
	`password` varchar(256) NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_games` ADD CONSTRAINT `user_games_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_games` ADD CONSTRAINT `user_games_game_id_games_id_fk` FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON DELETE no action ON UPDATE no action;