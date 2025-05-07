import { writeFile } from "node:fs/promises";
import path from "node:path";
import { toCamelCase } from "..";
import { pgTypeToTs } from "./postgres";

export const generateTypesFile = async ({
	destinationFolder,
	database,
	tables,
}: {
	destinationFolder: string;
	database: "postgres";
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
	let typeFile = "// Auto-generated database types\n\n";
	const interfaceNames: Record<string, string> = {};
	for (const [tableName, { columns }] of Object.entries(tables)) {
		const interfaceName = `${tableName.charAt(0).toUpperCase()}${toCamelCase(tableName).slice(1)}`;
		interfaceNames[tableName] = interfaceName;
		typeFile += `export interface ${tableName.charAt(0).toUpperCase()}${toCamelCase(tableName).slice(1)} {\n`;
		for (const { column_name, data_type, is_nullable } of columns) {
			let tsType = "";
			switch (database) {
				case "postgres":
					tsType = pgTypeToTs(data_type);
					break;
				default:
					console.error(`Unsupported database type: ${database}`);
					break;
			}
			const optional = is_nullable === "YES" ? "?" : "";
			typeFile += ` ${column_name}${optional}: ${tsType};\n`;
		}

		typeFile += "}\n\n";
	}
	typeFile += "export interface Database {\n";
	for (const [tableName, interfaceName] of Object.entries(interfaceNames)) {
		typeFile += `  ${toCamelCase(tableName)}: ${interfaceName};\n`;
	}
	typeFile += "}\n\n";
	await writeFile(path.join(destinationFolder, "src", "types.ts"), typeFile);
};
