import { copyFile, writeFile } from "node:fs/promises";
import prompts from "prompts";
import { getTablesAndColumns } from "./database";
import {
	convertTemplate,
	copyFolder,
	createFolder,
	createNewIndex,
	createNewTemplate,
	pgTypeToTs,
} from "./src/utils";

async function main() {
	const { DESTINATION_FOLDER } = await prompts({
		type: "text",
		name: "DESTINATION_FOLDER",
		message: "Choose a destination path:",
		initial: ".",
		validate: (value) => {
			if (!value) {
				return "Destination folder is required.";
			}
			if (value.includes(" ")) {
				return "Destination folder cannot contain spaces.";
			}
			return true;
		},
	});

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

	if (!DESTINATION_FOLDER) {
		console.error("Destination folder is required.");
		process.exit(1);
	}
	if (!runtime) {
		console.error("Runtime is required.");
		process.exit(1);
	}
	if (!httpServer) {
		console.error("HTTP server is required.");
		process.exit(1);
	}
	if (!queryBuilder) {
		console.error("Query builder is required.");
		process.exit(1);
	}

	// Log user choices
	console.log("User choices:");
	console.log(`Runtime: ${runtime}`);
	console.log(`HTTP Server: ${httpServer}`);
	console.log(`Query Builder: ${queryBuilder}`);

	// Continue with the existing functionality
	await copyFolder(DESTINATION_FOLDER, "./elysia_template", DESTINATION_FOLDER);
	await copyFile(
		`./src/template_files/${httpServer}/${queryBuilder}/db.ts`,
		`${DESTINATION_FOLDER}/src/db.ts`,
	);

	const tables = await getTablesAndColumns();

	let indexFile = "import { Elysia } from 'elysia';\n";
	let typeFile = "// Auto-generated database types\n\n";
	const interfaceNames: Record<string, string> = {};

	for (const [tableName, { columns }] of Object.entries(tables)) {
		await createFolder(
			DESTINATION_FOLDER,
			tableName.toLowerCase(),
			`${DESTINATION_FOLDER}/src/routes`,
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

		const { newController, newRepository } = await convertTemplate(
			DESTINATION_FOLDER,
			`src/template_files/${httpServer}/${queryBuilder}`,
			tableName,
			columns,
		);
		await createNewTemplate(
			DESTINATION_FOLDER,
			tableName,
			newController,
			"controller.ts",
		);
		await createNewTemplate(
			DESTINATION_FOLDER,
			tableName,
			newRepository,
			"repository.ts",
		);
		indexFile += `import ${tableName.charAt(0).toLowerCase()}${tableName.slice(1)}Router from "./${tableName.toLowerCase()}/controller";\n`;
	}

	await createNewIndex(DESTINATION_FOLDER, tables, indexFile);

	typeFile += "export interface Database {\n";
	for (const [tableName, interfaceName] of Object.entries(interfaceNames)) {
		typeFile += `  ${tableName}: ${interfaceName};\n`;
	}
	typeFile += "}\n\n";
	await writeFile(`${DESTINATION_FOLDER}/src/types.ts`, typeFile);
}

// Execute the main function
main().catch((error) => {
	console.error("Error:", error);
	process.exit(1);
});
