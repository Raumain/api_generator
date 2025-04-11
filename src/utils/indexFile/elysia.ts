import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { cleanupDestination } from "../index.js";

export const generateElysia = async ({
	destinationFolder,
	tables,
}: {
	destinationFolder: string;
	tables: Record<
		string,
		{
			columns: Array<{
				column_name: string;
				data_type: string;
				is_nullable: "YES" | "NO";
			}>;
		}
	>;
}) => {
	let indexFile = "import { Elysia } from 'elysia';\n";
	for (const [tableName, { columns }] of Object.entries(tables)) {
		indexFile += `import ${tableName.charAt(0).toLowerCase()}${tableName.slice(1)}Router from "./${tableName.toLowerCase()}/controller";\n`;
	}
	await createNewIndex({
		DESTINATION_FOLDER: destinationFolder,
		tables,
		indexFile,
	});
};

const createNewIndex = async ({
	DESTINATION_FOLDER,
	indexFile,
	tables,
}: {
	DESTINATION_FOLDER: string;
	tables: Record<
		string,
		{
			columns: Array<{
				column_name: string;
				data_type: string;
			}>;
		}
	>;
	indexFile: string;
}) => {
	try {
		let newIndexFile = indexFile;
		newIndexFile += `const app = new Elysia({ prefix: "/api" })\n`;

		for (const [tableName] of Object.entries(tables)) {
			newIndexFile += `.use(${tableName.charAt(0).toLowerCase()}${tableName.slice(1)}Router)\n`;
		}

		newIndexFile += "export default app;\n";

		// Ensure the directory exists
		const indexDir = path.dirname(`${DESTINATION_FOLDER}/src/routes/index.ts`);
		await mkdir(indexDir, { recursive: true });

		await writeFile(
			`${DESTINATION_FOLDER}/src/routes/index.ts`,
			newIndexFile,
			"utf-8",
		);
	} catch (error) {
		console.error(
			`Error creating index file: ${error instanceof Error ? error.message : String(error)}`,
		);
		await cleanupDestination(DESTINATION_FOLDER);
		throw error;
	}
};
