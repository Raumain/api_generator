import { getTablesAndColumns } from "./database";
import {
	convertTemplate,
	copyFolder,
	createFolder,
	createNewIndex,
	createNewTemplate,
} from "./src/utils";

await copyFolder("./elysia_template", "./src/elysia_template");

const tables = await getTablesAndColumns();

let indexFile = "";

for (const [tableName, { columns }] of Object.entries(tables)) {
	await createFolder(
		tableName.toLowerCase(),
		"./src/elysia_template/src/routes",
	);
	const newTemplate = await convertTemplate(tableName, columns);
	await createNewTemplate(tableName, newTemplate);
	indexFile += `import { ${tableName}Router } from "./${tableName.toLowerCase()}/controller";\n`;
}

await createNewIndex(tables, indexFile);
