import { getTables } from "./database";
import { copyFolder, createFolder } from "./src/utils";

await copyFolder("./elysia_template", "./src/elysia_template");

const tables = await getTables();

for (const table of tables) {
	const tableName = table.table_name;
	createFolder(tableName.toLowerCase(), "./src/elysia_template/src");
	console.log(`Copied template for ${tableName}`);
}
