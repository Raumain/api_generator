import { SQL } from "bun";

export const db = new SQL({
	url: "postgres://your_user:your_password@localhost:5432/your_database",
	max: 20,
	idleTimeout: 30,
	maxLifetime: 0,
	connectionTimeout: 30,
});

export const getTables = async () =>
	(await db`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
`) as Array<{ table_name: string }>;

