import { readFile, writeFile } from "node:fs/promises";
import type {
	DatabaseType,
	HttpServerType,
	QueryBuilderType,
} from "../../types/configTypes";

export const updatePackages = async ({
	packagePath,
	httpServer,
	queryBuilder,
	database,
}: {
	packagePath: string;
	httpServer: HttpServerType;
	queryBuilder: QueryBuilderType;
	database: DatabaseType;
}) => {
	const packageFile = await readFile(packagePath, "utf-8");
	if (!packageFile) {
		throw new Error(`Failed to read package file at ${packagePath}`);
	}
	const packageJson = JSON.parse(packageFile);

	switch (httpServer) {
		case "elysia":
			packageJson.dependencies = {
				...packageJson.dependencies,
				"@elysiajs/cors": "^1.1.1",
				"@elysiajs/swagger": "^1.1.1",
				elysia: "latest",
			};
			break;
		case "express":
			packageJson.dependencies = {
				...packageJson.dependencies,
				cors: "^2.8.5",
				express: "latest",
				"express-validator": "^7.2.1",
			};
			break;
		default:
			throw new Error(`Unsupported HTTP server: ${httpServer}`);
	}

	switch (queryBuilder) {
		case "kysely":
			packageJson.dependencies = {
				...packageJson.dependencies,
				kysely: "^0.27.4",
				"kysely-codegen": "^0.16.6",
				"kysely-migration-cli": "^0.4.2",
			};
			break;
		default:
			throw new Error(`Unsupported Query Builder: ${queryBuilder}`);
	}

	switch (database) {
		case "postgres":
			packageJson.dependencies = {
				...packageJson.dependencies,
				pg: "^8.11.9",
			};
			packageJson.devDependencies = {
				...packageJson.devDependencies,
				"@types/pg": "^8.10.2",
			};
			break;
		default:
			throw new Error(`Unsupported Database: ${database}`);
	}

	packageJson.devDependencies = {
		...packageJson.devDependencies,
		"@biomejs/biome": "^1.9.1",
		"bun-types": "latest",
	};

	await writeFile(packagePath, JSON.stringify(packageJson, null, 2), "utf-8");
};
