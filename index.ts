import { copyFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prompts from "prompts";
import { getTablesAndColumns } from "./database.js";
import {
	convertTemplate,
	copyFolder,
	createFolder,
	createNewIndex,
	createNewTemplate,
	pgTypeToTs,
} from "./src/utils.js";

// Get the directory name of the current module for relative paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function main(destinationFolder: string) {
	// Prompt for user choices
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

	// Log user choices
	console.log("User choices:");
	console.log(`Runtime: ${runtime}`);
	console.log(`HTTP Server: ${httpServer}`);
	console.log(`Query Builder: ${queryBuilder}`);

	// Use template paths based on user choices
	const templatePath = path.join(__dirname, "elysia_template");
	const dbTemplatePath = path.join(
		__dirname,
		"template_files",
		httpServer.toLowerCase(),
		queryBuilder.toLowerCase(),
		"db.ts",
	);

	// Continue with the existing functionality but use the dynamic paths
	await copyFolder(templatePath, destinationFolder);
	await copyFile(dbTemplatePath, path.join(destinationFolder, "src", "db.ts"));

	const tables = await getTablesAndColumns();

	let indexFile = "import { Elysia } from 'elysia';\n";
	let typeFile = "// Auto-generated database types\n\n";
	const interfaceNames: Record<string, string> = {};

	for (const [tableName, { columns }] of Object.entries(tables)) {
		await createFolder(
			destinationFolder,
			tableName.toLowerCase(),
			path.join(destinationFolder, "src", "routes"),
		);

		const interfaceName = `${tableName.charAt(0).toUpperCase()}${tableName.slice(1)}`;
		interfaceNames[tableName] = interfaceName;
		typeFile += `export interface ${tableName.charAt(0).toUpperCase()}${tableName.slice(1)} {\n`;
		for (const { column_name, data_type, is_nullable } of columns) {
			const tsType = pgTypeToTs(data_type);
			const optional = is_nullable === "YES" ? "?" : "";
			typeFile += ` ${column_name}${optional}: ${tsType};\n`;
		}

		typeFile += "}\n\n";

		// Use the appropriate template path based on user choices
		const templateBasePath = path.join(
			__dirname,
			"template_files",
			httpServer.toLowerCase(),
			queryBuilder.toLowerCase(),
		);

		const { newController, newRepository } = await convertTemplate(
			destinationFolder,
			templateBasePath,
			tableName,
			columns,
		);
		await createNewTemplate(
			destinationFolder,
			tableName,
			newController,
			"controller.ts",
		);
		await createNewTemplate(
			destinationFolder,
			tableName,
			newRepository,
			"repository.ts",
		);
		indexFile += `import ${tableName.charAt(0).toLowerCase()}${tableName.slice(1)}Router from "./${tableName.toLowerCase()}/controller";\n`;
	}

	await createNewIndex(destinationFolder, tables, indexFile);

	typeFile += "export interface Database {\n";
	for (const [tableName, interfaceName] of Object.entries(interfaceNames)) {
		typeFile += `  ${tableName}: ${interfaceName};\n`;
	}
	typeFile += "}\n\n";
	await writeFile(path.join(destinationFolder, "src", "types.ts"), typeFile);
}

// Only run if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const targetDir = process.argv[2] || ".";
	main(path.resolve(process.cwd(), targetDir)).catch((error) => {
		console.error("Error:", error);
		process.exit(1);
	});
}
