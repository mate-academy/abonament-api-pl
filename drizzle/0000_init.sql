CREATE TABLE "loans" (
	"id" serial PRIMARY KEY NOT NULL,
	"reader_id" integer NOT NULL,
	"book_id" integer NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"returned_at" timestamp with time zone,
	"renewals" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "readers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"api_token" text NOT NULL,
	CONSTRAINT "readers_api_token_unique" UNIQUE("api_token")
);
--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_reader_id_readers_id_fk" FOREIGN KEY ("reader_id") REFERENCES "public"."readers"("id") ON DELETE no action ON UPDATE no action;