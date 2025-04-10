import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Helper function to clean up the destination folder in case of an error
 */
async function cleanupDestination(DESTINATION_FOLDER: string) {
	try {
		console.log(`Cleaning up destination folder: ${DESTINATION_FOLDER}`);
		await fs.rm(DESTINATION_FOLDER, { recursive: true, force: true });
	} catch (cleanupError) {
		console.error(
			`Failed to clean up destination folder: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
		);
	}
}

/**
 * Recursively copies a folder to a new destination.
 * @param src Source folder path
 * @param dest Destination folder path
 */
export async function copyFolder(
	DESTINATION_FOLDER: string,
	src: string,
	dest: string,
) {
	try {
		try {
			const destStats = await fs.stat(dest);

			if (destStats.isDirectory()) {
				// Check if the directory is not empty
				const files = await fs.readdir(dest);
				if (files.length > 0) {
					throw new Error(
						`Destination folder ${dest} already exists and is not empty`,
					);
				}
			}
		} catch (error) {
			const err = error as NodeJS.ErrnoException;
			if (err.code !== "ENOENT") {
				throw error; // If it's not a "not found" error, rethrow it
			}
		}

		await fs.mkdir(dest, { recursive: true });
		const entries = await fs.readdir(src, { withFileTypes: true });

		for (const entry of entries) {
			const srcPath = path.join(src, entry.name);
			const destPath = path.join(dest, entry.name);

			if (entry.isDirectory()) {
				await copyFolder(DESTINATION_FOLDER, srcPath, destPath);
			} else {
				await fs.copyFile(srcPath, destPath);
			}
		}
	} catch (error) {
		console.error(
			`Error copying folder from ${src} to ${dest}: ${error instanceof Error ? error.message : String(error)}`,
		);
		if (error instanceof Error && error.message.includes("not empty")) {
			console.error("Please remove it before proceeding.");
		} else {
			await cleanupDestination(DESTINATION_FOLDER);
		}
		throw error;
	}
}

/**
 * Creates a new folder at the specified destination.
 * @param folderName Name of the new folder
 * @param dest Destination path where the folder will be created
 */
export async function createFolder(
	DESTINATION_FOLDER: string,
	folderName: string,
	dest: string,
) {
	try {
		const folderPath = path.join(dest, folderName);
		await fs.mkdir(folderPath, { recursive: true });
		return folderPath;
	} catch (error) {
		console.error(
			`Error creating folder ${folderName} at ${dest}: ${error instanceof Error ? error.message : String(error)}`,
		);
		await cleanupDestination(DESTINATION_FOLDER);
		throw error;
	}
}

/**
 * Converts PostgreSQL types to TypeBox types.
 */
export function pgTypeToTypebox(pgType: string) {
	try {
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
				console.warn(
					`Unknown PostgreSQL type: ${pgType}, defaulting to t.Unknown()`,
				);
				return "t.Unknown()";
		}
	} catch (error) {
		console.error(
			`Error converting PostgreSQL type ${pgType}: ${error instanceof Error ? error.message : String(error)}`,
		);
		throw error;
	}
}

export function pgTypeToTs(pgType: string): string {
	switch (pgType) {
		case "uuid":
		case "character varying":
		case "varchar":
		case "text":
		case "char":
		case "name":
			return "string";
		case "integer":
		case "smallint":
		case "bigint":
		case "real":
		case "numeric":
		case "double precision":
			return "number";
		case "boolean":
			return "boolean";
		case "json":
		case "jsonb":
			return "any";
		case "date":
		case "timestamp without time zone":
		case "timestamp with time zone":
			return "string"; // Or consider 'Date' if you parse it
		case "bytea":
			return "Buffer";
		default:
			return "unknown";
	}
}

export const convertTemplate = async (
	DESTINATION_FOLDER: string,
	basePath: string,
	tableName: string,
	columns: Array<{ column_name: string; data_type: string }>,
) => {
	try {
		const controller = Bun.file(`${basePath}/controller.ts`);
		const repository = Bun.file(`${basePath}/repository.ts`);

		const [controllerContent, repositoryContent] = await Promise.all([
			controller.text(),
			repository.text(),
		]).catch((error) => {
			throw new Error(
				`Failed to read template files: ${error instanceof Error ? error.message : String(error)}`,
			);
		});

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
			.replaceAll(/__TABLE__/g, tableName.toLowerCase())
			.replaceAll(
				/__CAP_TABLE__/g,
				tableName.charAt(0).toUpperCase() + tableName.slice(1).toLowerCase(),
			)
			.replaceAll(/__RAW_TABLE__/g, tableName);

		return { newController, newRepository };
	} catch (error) {
		console.error(
			`Error converting template for table ${tableName}: ${error instanceof Error ? error.message : String(error)}`,
		);
		await cleanupDestination(DESTINATION_FOLDER);
		throw error;
	}
};

export const createNewTemplate = async (
	DESTINATION_FOLDER: string,
	tableName: string,
	newTemplate: string,
	filename: string,
) => {
	try {
		const routeDir = path.join(
			`${DESTINATION_FOLDER}/src/routes`,
			tableName.toLowerCase(),
		);

		// Ensure directory exists before writing file
		await fs.mkdir(routeDir, { recursive: true });

		const newFileName = path.join(routeDir, filename);
		await fs.writeFile(newFileName, newTemplate);
	} catch (error) {
		console.error(
			`Error creating new template for ${tableName}/${filename}: ${error instanceof Error ? error.message : String(error)}`,
		);
		await cleanupDestination(DESTINATION_FOLDER);
		throw error;
	}
};

export const createNewIndex = async (
	DESTINATION_FOLDER: string,
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
	try {
		let newIndexFile = indexFile;
		newIndexFile += `export const app = new Elysia({ prefix: "/api" })\n`;

		for (const [tableName] of Object.entries(tables)) {
			newIndexFile += `.use(${tableName.charAt(0).toLowerCase()}${tableName.slice(1)}Router)\n`;
		}

		newIndexFile += "export default app;\n";

		// Ensure the directory exists
		const indexDir = path.dirname(`${DESTINATION_FOLDER}/src/routes/index.ts`);
		await fs.mkdir(indexDir, { recursive: true });

		await fs.writeFile(
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
