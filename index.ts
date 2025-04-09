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

const tables = await getTablesAndColumns();

let indexFile = "";

for (const [tableName, { columns }] of Object.entries(tables)) {
	await createFolder(
		tableName.toLowerCase(),
		`${DESTINATION_FOLDER}/src/routes`,
	);
	const newTemplate = await convertTemplate(tableName, columns);
	await createNewTemplate(tableName, newTemplate);
	indexFile += `import ${tableName.charAt(0).toLowerCase()}${tableName.slice(1)}Router from "./${tableName.toLowerCase()}/controller";\n`;
}

await createNewIndex(tables, indexFile);
