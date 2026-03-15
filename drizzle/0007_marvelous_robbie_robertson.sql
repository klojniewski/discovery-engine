ALTER TABLE "pages" ADD COLUMN "canonical_url" text;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "meta_robots" text;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "schema_org_types" jsonb;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "internal_link_count" integer;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "organic_traffic" integer;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "traffic_value_cents" integer;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "top_keyword" text;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "top_keyword_volume" integer;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "top_keyword_position" integer;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "referring_domains" integer;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "psi_score_mobile" integer;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "psi_score_desktop" integer;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "seo_score" integer;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "is_redirect_critical" boolean DEFAULT false;--> statement-breakpoint
CREATE INDEX "pages_project_redirect_critical" ON "pages" USING btree ("project_id","is_redirect_critical");--> statement-breakpoint
CREATE INDEX "pages_project_seo_score" ON "pages" USING btree ("project_id","seo_score");