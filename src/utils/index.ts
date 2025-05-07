import { promises as fs } from "node:fs";
import path from "node:path";
import { pgTypeToTypebox } from "./types/postgres";

/**
 * Helper function to clean up the destination folder in case of an error
 */
export async function cleanupDestination(DESTINATION_FOLDER: string) {
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
export async function copyFolder(src: string, dest: string) {
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
				await copyFolder(srcPath, destPath);
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
			await cleanupDestination(dest);
		}
		throw error;
	}
}

/**
 * Creates a new folder at the specified destination.
 * @param folderName Name of the new folder
 * @param dest Destination path where the folder will be created
 */
export async function createFolder(DESTINATION_FOLDER: string, dest: string) {
	try {
		await fs.mkdir(dest, { recursive: true });
		return dest;
	} catch (error) {
		console.error(
			`Error creating ${dest}: ${error instanceof Error ? error.message : String(error)}`,
		);
		await cleanupDestination(DESTINATION_FOLDER);
		throw error;
	}
}

/**
 * Converts template files for a specific table.
 * @param DESTINATION_FOLDER Destination folder path
 * @param controllerPath Path to the controller template
 * @param repositoryPath Path to the repository template
 * @param columns Array of column definitions for the table
 * @param tableName Name of the table
 */
export const convertTemplate = async ({
	DESTINATION_FOLDER,
	controllerPath,
	repositoryPath,
	columns,
	tableName,
}: {
	DESTINATION_FOLDER: string;
	controllerPath: string;
	repositoryPath: string;
	tableName: string;
	columns: Array<{ column_name: string; data_type: string }>;
}) => {
	try {
		const [controllerContent, repositoryContent] = await Promise.all([
			fs.readFile(controllerPath, "utf-8"),
			fs.readFile(repositoryPath, "utf-8"),
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
			.replaceAll(/__TABLE__/g, toCamelCase(tableName))
			.replaceAll(
				/__CAP_TABLE__/g,
				tableName.charAt(0).toUpperCase() + toCamelCase(tableName).slice(1),
			)
			.replaceAll(/__COLUMNS__/g, columnDefinitions);

		const newRepository = repositoryContent
			.replaceAll(/__TABLE__/g, toCamelCase(tableName))
			.replaceAll(
				/__CAP_TABLE__/g,
				tableName.charAt(0).toUpperCase() + toCamelCase(tableName).slice(1),
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

/**
 * Creates a new template file for a specific table.
 * @param DESTINATION_FOLDER Destination folder path
 * @param tableName Name of the table
 * @param newTemplate Template content to be written
 * @param filename Name of the file to be created
 */
export const createNewTemplate = async (
	DESTINATION_FOLDER: string,
	tableName: string,
	newTemplate: string,
	filename: string,
) => {
	try {
		const routeDir = path.join(
			`${DESTINATION_FOLDER}/src/routes`,
			toCamelCase(tableName),
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

/**
 * Creates routes for each table in the database.
 * @param destinationFolder Destination folder path
 * @param tables Tables to create routes for
 * @param controllerPath Path to the controller template
 * @param repositoryPath Path to the repository template
 * */
export const createRoutes = async ({
	destinationFolder,
	tables,
	controllerPath,
	repositoryPath,
}: {
	destinationFolder: string;
	tables: Record<
		string,
		{
			columns: Array<{
				column_name: string;
				data_type: string;
			}>;
		}
	>;
	controllerPath: string;
	repositoryPath: string;
}) => {
	for (const [tableName, { columns }] of Object.entries(tables)) {
		await createFolder(
			destinationFolder,
			path.join(destinationFolder, "src", "routes", toCamelCase(tableName)),
		);

		const { newController, newRepository } = await convertTemplate({
			DESTINATION_FOLDER: destinationFolder,
			controllerPath,
			repositoryPath,
			tableName,
			columns,
		});
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
	}
};

export const toCamelCase = (str: string) => {
	return str
		.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
		.replace(/^./, (char) => char.toLowerCase());
};
