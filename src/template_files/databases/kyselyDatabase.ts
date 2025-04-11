import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
// import type { DB } from "kysely-codegen"; // Codegen database types
import type { Database } from "./types"; // Auto-generated database types

export const db = new Kysely<Database>({
	dialect: new PostgresDialect({
		pool: new Pool({
			connectionString: process.env.DATABASE_URL,
		}),
	}),
});
