import { copyFile, writeFile } from "node:fs/promises";
import { getTablesAndColumns } from "./database";
import {
	convertTemplate,
	copyFolder,
	createFolder,
	createNewIndex,
	createNewTemplate,
	pgTypeToTs,
} from "./src/utils";

export const DESTINATION_FOLDER = "/home/romain/WRK/elysia_template";

await copyFolder("./elysia_template", DESTINATION_FOLDER);
await copyFile(
	"./src/template_files/elysia/kysely/db.ts",
	`${DESTINATION_FOLDER}/src/db.ts`,
);

const tables = await getTablesAndColumns();

let indexFile = "import { Elysia } from 'elysia';\n";
let typeFile = "// Auto-generated database types\n\n";
const interfaceNames: Record<string, string> = {};

for (const [tableName, { columns }] of Object.entries(tables)) {
	await createFolder(
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
		tableName,
		columns,
	);
	await createNewTemplate(tableName, newController, "controller.ts");
	await createNewTemplate(tableName, newRepository, "repository.ts");
	indexFile += `import ${tableName.charAt(0).toLowerCase()}${tableName.slice(1)}Router from "./${tableName.toLowerCase()}/controller";\n`;
}

await createNewIndex(tables, indexFile);

typeFile += "export interface Database {\n";
for (const [tableName, interfaceName] of Object.entries(interfaceNames)) {
	typeFile += `  ${tableName}: ${interfaceName};\n`;
}
typeFile += "}\n\n";
await writeFile(`${DESTINATION_FOLDER}/src/types.ts`, typeFile);
