import { copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prompts from "prompts";
import { getTablesAndColumns } from "./database.js";
import { copyFolder, createRoutes } from "./src/utils.js";
import { generateIndexFile } from "./src/utils/index";
import { generateTypesFile } from "./src/utils/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function main(destinationFolder: string) {
	const { runtime } = await prompts({
		type: "select",
		name: "runtime",
		message: "Choose a runtime:",
		choices: [{ title: "Bun", value: "bun" }],
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

	const tables = await getTablesAndColumns();

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
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const targetDir = process.argv[2] || ".";
	main(path.resolve(process.cwd(), targetDir)).catch((error) => {
		console.error("Error:", error);
		process.exit(1);
	});
}
