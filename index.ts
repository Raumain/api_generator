import { copyFile } from "node:fs/promises";
import { getTablesAndColumns } from "./database";
import {
	convertTemplate,
	copyFolder,
	createFolder,
	createNewIndex,
	createNewTemplate,
} from "./src/utils";

export const DESTINATION_FOLDER = "./src/elysia_template";

await copyFolder("./elysia_template", DESTINATION_FOLDER);
await copyFile(
	"./src/template_files/elysia/kysely/db.ts",
	`${DESTINATION_FOLDER}/src/db.ts`,
);

const tables = await getTablesAndColumns();

let indexFile = "";

for (const [tableName, { columns }] of Object.entries(tables)) {
	await createFolder(
		tableName.toLowerCase(),
		`${DESTINATION_FOLDER}/src/routes`,
	);
	const { newController, newRepository } = await convertTemplate(
		tableName,
		columns,
	);
	await createNewTemplate(tableName, newController, "controller.ts");
	await createNewTemplate(tableName, newRepository, "repository.ts");
	indexFile += `import ${tableName.charAt(0).toLowerCase()}${tableName.slice(1)}Router from "./${tableName.toLowerCase()}/controller";\n`;
}

await createNewIndex(tables, indexFile);
