import { promises as fs } from "node:fs";
import path from "node:path";
import { DESTINATION_FOLDER } from "..";

/**
 * Recursively copies a folder to a new destination.
 * @param src Source folder path
 * @param dest Destination folder path
 */
export async function copyFolder(src: string, dest: string) {
	await fs.mkdir(dest, { recursive: true });
	const entries = await fs.readdir(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			await copyFolder(srcPath, destPath);
		} else {
			await fs.copyFile(srcPath, destPath);
		}
	}
}

/**
 * Creates a new folder at the specified destination.
 * @param folderName Name of the new folder
 * @param dest Destination path where the folder will be created
 */
export async function createFolder(folderName: string, dest: string) {
	const folderPath = path.join(dest, folderName);
	await fs.mkdir(folderPath, { recursive: true });
	return folderPath;
}

/**
 * Converts PostgreSQL types to TypeBox types.
 */
export function pgTypeToTypebox(pgType: string) {
	switch (pgType) {
		case "uuid":
		case "character varying":
		case "varchar":
		case "text":
		case "bytea":
			return "t.String()";
		case "integer":
		case "smallint":
		case "bigint":
			return "t.Integer()";
		case "numeric":
		case "real":
		case "double precision":
			return "t.Number()";
		case "boolean":
			return "t.Boolean()";
		case "date":
		case "timestamp without time zone":
		case "timestamp with time zone":
			return 't.String({ format: "date-time" })';
		case "json":
		case "jsonb":
			return "t.Any()";
		default:
			return "t.Unknown()";
	}
}

export const convertTemplate = async (
	tableName: string,
	columns: Array<{ column_name: string; data_type: string }>,
) => {
	const controller = Bun.file("src/template_files/elysia/kysely/controller.ts");
	const repository = Bun.file("src/template_files/elysia/kysely/repository.ts");
	const controllerContent = await controller.text();
	const repositoryContent = await repository.text();
	const columnDefinitions = columns
		.map(({ column_name, data_type }) => {
			const typeboxType = pgTypeToTypebox(data_type);
			return `\t${column_name}: ${typeboxType}`;
		})
		.join(",\n");
	const newController = controllerContent
		.replaceAll(/__TABLE__/g, tableName.toLowerCase())
		.replaceAll(
			/__CAP_TABLE__/g,
			tableName.charAt(0).toUpperCase() + tableName.slice(1).toLowerCase(),
		)
		.replaceAll(/__RAW_TABLE__/g, tableName)
		.replaceAll(/__COLUMNS__/g, columnDefinitions);
	const newRepository = repositoryContent
		.replaceAll(
			/__CAP_TABLE__/g,
			tableName.charAt(0).toUpperCase() + tableName.slice(1).toLowerCase(),
		)
		.replaceAll(/__RAW_TABLE__/g, tableName);
	return { newController, newRepository };
};

export const createNewTemplate = async (
	tableName: string,
	newTemplate: string,
	filename: string,
) => {
	const newFileName = path.join(
		`${DESTINATION_FOLDER}/src/routes`,
		tableName.toLowerCase(),
		filename,
	);
	await fs.appendFile(newFileName, newTemplate);
};

export const createNewIndex = async (
	tables: Record<
		string,
		{
			columns: Array<{
				column_name: string;
				data_type: string;
			}>;
		}
	>,
	indexFile: string,
) => {
	let newIndexFile = indexFile;
	newIndexFile += `export const app = new Elysia({ prefix: "/api" })\n`;
	for (const [tableName] of Object.entries(tables)) {
		newIndexFile += `.use(${tableName.charAt(0).toLowerCase()}${tableName.slice(1)}Router)\n`;
	}
	newIndexFile += "export default app;\n";
	await fs.writeFile(
		`${DESTINATION_FOLDER}/src/routes/index.ts`,
		newIndexFile,
		"utf-8",
	);
};
