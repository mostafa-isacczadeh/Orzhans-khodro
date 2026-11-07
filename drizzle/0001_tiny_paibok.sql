ALTER TABLE "offers" ADD COLUMN "available_after_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" DROP COLUMN "warranty_months";--> statement-breakpoint
ALTER TABLE "offers" DROP COLUMN "message";