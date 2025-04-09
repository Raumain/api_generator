import { promises as fs } from "node:fs";
import path from "node:path";

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

// A function that create a new file called index.ts into destination
