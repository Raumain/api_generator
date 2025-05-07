import { copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prompts from "prompts";
import { getTablesAndColumns } from "./database.js";
import { copyFolder, createRoutes } from "./src/utils/";
import { generateIndexFile } from "./src/utils/indexFile";
import { updatePackages } from "./src/utils/packages/index.js";
import { generateSchemas } from "./src/utils/schemas/index.js";
import { generateTypesFile } from "./src/utils/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function main(destinationFolder: string) {
	// const { runtime } = await prompts({
	// 	type: "select",
	// 	name: "runtime",
	// 	message: "Choose a runtime:",
	// 	choices: [{ title: "Bun", value: "bun" }],
	// });

	const { database } = await prompts({
		type: "select",
		name: "database",
		message: "Choose a database:",
		choices: [{ title: "Postgres", value: "postgres" }],
	});

	const { db_user } = await prompts({
		type: "text",
		name: "db_user",
		message: "Enter your databaser username:",
	});

	const { db_password } = await prompts({
		type: "password",
		name: "db_password",
		message: "Enter your database password:",
	});

	const { db_server } = await prompts({
		type: "text",
		name: "db_server",
		message: "Enter your database server:",
	});

	const { dp_port } = await prompts({
		type: "number",
		name: "dp_port",
		message: "Enter your database port:",
	});

	const { db_database } = await prompts({
		type: "text",
		name: "db_database",
		message: "Enter your database name:",
	});

	const { httpServer } = await prompts({
		type: "select",
		name: "httpServer",
		message: "Choose an HTTP server:",
		choices: [{ title: "Elysia", value: "elysia" }],
	});

	const { queryBuilder } = await prompts({
		type: "select",
		name: "queryBuilder",
		message: "Choose an ORM/Query Builder:",
		choices: [{ title: "Kysely", value: "kysely" }],
	});

	const templatePath = path.join(__dirname, "elysia_template");
	const templateFilesPath = path.join(__dirname, "template_files");
	const dbTemplatePath = path.join(
		__dirname,
		"template_files",
		"databases",
		`${queryBuilder.toLowerCase()}Database.ts`,
	);
	const controllerPath = path.join(
		templateFilesPath,
		"controllers",
		`${httpServer.toLowerCase()}Controller.ts`,
	);
	const repositoryPath = path.join(
		templateFilesPath,
		"repositories",
		`${queryBuilder.toLowerCase()}Repository.ts`,
	);

	await copyFolder(templatePath, destinationFolder);
	await copyFile(dbTemplatePath, path.join(destinationFolder, "src", "db.ts"));

	const tables = await getTablesAndColumns({
		connectionString: `postgresql://${db_user}:${db_password}@${db_server}:${dp_port}/${db_database}`,
	});

	await createRoutes({
		destinationFolder,
		tables,
		controllerPath,
		repositoryPath,
	});

	await generateIndexFile({
		destinationFolder,
		httpServer,
		tables,
	});

	await generateTypesFile({
		destinationFolder,
		database: "postgres",
		tables,
	});

	await generateSchemas({
		destinationFolder,
		database: "postgres",
		tables,
	});

	await updatePackages({
		packagePath: path.join(destinationFolder, "package.json"),
		httpServer,
		queryBuilder,
		database: "postgres",
	});
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const targetDir = process.argv[2] || ".";
	main(path.resolve(process.cwd(), targetDir)).catch((error) => {
		console.error("Error:", error);
		process.exit(1);
	});
}
