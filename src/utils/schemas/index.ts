import { writeFile } from "node:fs/promises";
import path from "node:path";
import { toCamelCase } from "..";
import { pgTypeToTypebox } from "../types/postgres";

export const generateSchemas = async ({
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
	const generatedCols = [
		"id",
		"created_at",
		"created_by",
		"updated_at",
		"updated_by",
	];

	const generatedData = `export const generatedData = t.Object({
  id: t.String(),
  createdAt: t.String({ format: "date-time", default: () => new Date().toISOString() }),
  createdBy: t.String(),
  updatedAt: t.String({ format: "date-time", default: () => new Date().toISOString() }),
  updatedBy: t.String(),
});\n\n`;
	await writeFile(
		path.join(destinationFolder, "src", "schemas", "generated.ts"),
		generatedData,
	);

	for (const [tableName, { columns }] of Object.entries(tables)) {
		let schema = `import { t } from "elysia";\n`;
		schema += `import { generatedData } from "./generated";\n\n`;
		schema = `export const ${tableName}Create = t.Object({\n`;
		for (const { column_name, data_type, is_nullable } of columns) {
			if (generatedCols.includes(column_name)) {
				continue;
			}
			let tsType = "";
			switch (database) {
				case "postgres":
					tsType = pgTypeToTypebox(data_type);
					break;
				default:
					console.error(`Unsupported database type: ${database}`);
					break;
			}
			tsType = is_nullable ? `t.Optional(${tsType})` : tsType;
			schema += ` ${toCamelCase(column_name)}: ${tsType},\n`;
		}
		schema += "});\n\n";
		schema += `export const ${toCamelCase(tableName)}Base = t.Intersect([generatedData, ${toCamelCase(tableName)}Create]);\n\n`;
		await writeFile(
			path.join(
				destinationFolder,
				"src",
				"schemas",
				`${toCamelCase(tableName)}.ts`,
			),
			schema,
		);
	}
};
