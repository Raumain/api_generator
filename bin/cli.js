#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, "../dist/index.js");

// Check if the dist file exists
if (!fs.existsSync(distPath)) {
	console.error(
		'Error: Build files not found. Please run "npm run build" first.',
	);
	process.exit(1);
}

// Import the built module
import("../dist/index.js")
	.then((module) => {
		// Get the target directory from command line arguments
		const targetDir = process.argv[2] || ".";
		const resolvedPath = path.resolve(process.cwd(), targetDir);

		// Run the main function
		return module.main(resolvedPath);
	})
	.then(() => {
		console.log("✨ API successfully generated!");
    process.exit(0);
	})
	.catch((err) => {
		console.error("Failed to generate API:", err);
		process.exit(1);
	});
