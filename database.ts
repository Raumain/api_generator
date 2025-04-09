import { SQL } from "bun";

export const db = new SQL({
	url: "postgres://your_user:your_password@localhost:5432/your_database",
	max: 20,
	idleTimeout: 30,
	maxLifetime: 0,
	connectionTimeout: 30,
});

